// src/list-item/list-item-comment.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListItemComment } from './entities/list-item-comment.entity';
import { ListItem } from './entities/list-item.entity';
import { WorkspaceMember, WorkspaceMemberStatus } from '../workspace/entities/workspace-member.entity';
import { ListItemActivity, ActivityType } from './entities/list-item-activity.entity'; 
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class ListItemCommentService {
  constructor(
    @InjectRepository(ListItemComment)
    private commentRepository: Repository<ListItemComment>,
    @InjectRepository(ListItem)
    private listItemRepository: Repository<ListItem>,
    @InjectRepository(WorkspaceMember)
    private workspaceMemberRepository: Repository<WorkspaceMember>,
    @InjectRepository(ListItemActivity)
    private activityRepository: Repository<ListItemActivity>,
  ) {}

  private async verifyItemAccess(userId: string, itemId: string): Promise<ListItem> {
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

    return item;
  }

  async addComment(userId: string, itemId: string, createCommentDto: CreateCommentDto) {
    await this.verifyItemAccess(userId, itemId);

    const comment = this.commentRepository.create({
      content: createCommentDto.content,
      listItemId: itemId,
      authorId: userId,
    });

    const savedComment = await this.commentRepository.save(comment);

    await this.listItemRepository.increment({ id: itemId }, 'commentsCount', 1);

    const activity = this.activityRepository.create({
      listItemId: itemId,
      userId,
      type: ActivityType.COMMENT_ADDED,
      description: 'added a comment',
      metadata: { commentId: savedComment.id },
    });
    await this.activityRepository.save(activity);

    const commentWithAuthor = await this.commentRepository.findOne({
      where: { id: savedComment.id },
      relations: ['author'],
      select: {
        id: true,
        content: true,
        isEdited: true,
        createdAt: true,
        updatedAt: true,
        author: {
          id: true,
          name: true,
          email: true,
        },
      },
    });

    return {
      message: 'Comment added successfully',
      comment: commentWithAuthor,
    };
  }

  async getItemComments(userId: string, itemId: string) {
    await this.verifyItemAccess(userId, itemId);

    const comments = await this.commentRepository.find({
      where: { listItemId: itemId },
      relations: ['author'],
      select: {
        id: true,
        content: true,
        isEdited: true,
        editedAt: true,
        createdAt: true,
        updatedAt: true,
        author: {
          id: true,
          name: true,
          email: true,
        },
      },
      order: {
        createdAt: 'ASC',
      },
    });

    return comments;
  }

  async updateComment(
    userId: string,
    commentId: string,
    updateCommentDto: UpdateCommentDto,
  ) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    comment.content = updateCommentDto.content;
    comment.isEdited = true;
    comment.editedAt = new Date();

    await this.commentRepository.save(comment);

    return {
      message: 'Comment updated successfully',
      comment,
    };
  }

  async deleteComment(userId: string, commentId: string) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentRepository.remove(comment);

    await this.listItemRepository.decrement(
      { id: comment.listItemId },
      'commentsCount',
      1,
    );

    return {
      message: 'Comment deleted successfully',
    };
  }
}