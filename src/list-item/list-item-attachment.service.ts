// src/list-item/list-item-attachment.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListItemAttachment } from './entities/list-item-attachment.entity';
import { ListItem } from './entities/list-item.entity';
import {
  WorkspaceMember,
  WorkspaceMemberRole,
  WorkspaceMemberStatus,
} from '../workspace/entities/workspace-member.entity';
import {
  ListItemActivity,
  ActivityType,
} from './entities/list-item-activity.entity';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ListItemAttachmentService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(
    @InjectRepository(ListItemAttachment)
    private attachmentRepository: Repository<ListItemAttachment>,
    @InjectRepository(ListItem)
    private listItemRepository: Repository<ListItem>,
    @InjectRepository(WorkspaceMember)
    private workspaceMemberRepository: Repository<WorkspaceMember>,
    @InjectRepository(ListItemActivity)
    private activityRepository: Repository<ListItemActivity>,
    private configService: ConfigService,
  ) {
    const accessKey = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    const endpoint = this.configService.get<string>('R2_ENDPOINT');

    if (!accessKey || !secretKey) {
      throw new Error('R2 credentials are not set in environment');
    }

    this.s3Client = new S3Client({
      region: this.configService.get<string>('R2_REGION') ?? 'auto',
      endpoint,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });

    this.bucketName = this.configService.get('R2_BUCKET_NAME') ?? '';
  }

  private async verifyItemAccess(
    userId: string,
    itemId: string,
  ): Promise<{ item: ListItem; member: WorkspaceMember }> {
    const item = await this.listItemRepository.findOne({
      where: { id: itemId },
      relations: ['list', 'list.workspace'],
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    const member = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId: item.list.workspace.id,
        userId,
        status: WorkspaceMemberStatus.ACTIVE,
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    if (member.role === WorkspaceMemberRole.GUEST) {
      throw new ForbiddenException('Guests cannot upload attachments');
    }

    return { item, member };
  }

  async uploadAttachment(
    userId: string,
    itemId: string,
    file: Express.Multer.File,
  ) {
    await this.verifyItemAccess(userId, itemId);

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    const timestamp = Date.now();
    const fileExtension = file.originalname.split('.').pop();
    const fileKey = `attachments/${itemId}/${timestamp}-${file.originalname}`;

    try {
      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(uploadCommand);

      const fileUrl = `${this.configService.get('R2_PUBLIC_URL')}/${fileKey}`;

      const attachment = this.attachmentRepository.create({
        fileName: file.originalname,
        fileUrl,
        fileKey,
        fileSize: file.size,
        mimeType: file.mimetype,
        listItemId: itemId,
        uploadedById: userId,
      });

      const savedAttachment = await this.attachmentRepository.save(attachment);

      await this.listItemRepository.increment(
        { id: itemId },
        'attachmentsCount',
        1,
      );

      const activity = this.activityRepository.create({
        listItemId: itemId,
        userId,
        type: ActivityType.ATTACHMENT_ADDED,
        description: `attached ${file.originalname}`,
        metadata: {
          attachmentId: savedAttachment.id,
          fileName: file.originalname,
        },
      });
      await this.activityRepository.save(activity);

      const attachmentWithUploader = await this.attachmentRepository.findOne({
        where: { id: savedAttachment.id },
        relations: ['uploadedBy'],
        select: {
          id: true,
          fileName: true,
          fileUrl: true,
          fileSize: true,
          mimeType: true,
          createdAt: true,
          uploadedBy: {
            id: true,
            name: true,
          },
        },
      });

      return {
        message: 'File uploaded successfully',
        attachment: attachmentWithUploader,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  async getItemAttachments(userId: string, itemId: string) {
    await this.verifyItemAccess(userId, itemId);

    const attachments = await this.attachmentRepository.find({
      where: { listItemId: itemId },
      relations: ['uploadedBy'],
      select: {
        id: true,
        fileName: true,
        fileUrl: true,
        fileSize: true,
        mimeType: true,
        createdAt: true,
        uploadedBy: {
          id: true,
          name: true,
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return attachments;
  }

  async deleteAttachment(userId: string, attachmentId: string) {
    const attachment = await this.attachmentRepository.findOne({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    await this.verifyItemAccess(userId, attachment.listItemId);

    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: attachment.fileKey,
      });

      await this.s3Client.send(deleteCommand);

      await this.attachmentRepository.remove(attachment);

      await this.listItemRepository.decrement(
        { id: attachment.listItemId },
        'attachmentsCount',
        1,
      );

      const activity = this.activityRepository.create({
        listItemId: attachment.listItemId,
        userId,
        type: ActivityType.ATTACHMENT_DELETED,
        description: `deleted attachment ${attachment.fileName}`,
        metadata: {
          fileName: attachment.fileName,
        },
      });
      await this.activityRepository.save(activity);

      return {
        message: 'Attachment deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(`Failed to delete file: ${error.message}`);
    }
  }

  async setAsCover(userId: string, attachmentId: string) {
    const attachment = await this.attachmentRepository.findOne({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    if (!attachment.mimeType.startsWith('image/')) {
      throw new BadRequestException('Only images can be set as cover');
    }

    await this.verifyItemAccess(userId, attachment.listItemId);

    await this.listItemRepository.update(
      { id: attachment.listItemId },
      { coverImage: attachment.fileUrl },
    );

    return {
      message: 'Cover image set successfully',
    };
  }
}
