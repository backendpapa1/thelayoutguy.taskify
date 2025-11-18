// src/list-item/entities/list-item-attachment.entity.ts
import { BaseEntity } from 'src/_services/base/base.entity';
import { ListItem } from './list-item.entity';
import { User } from 'src/user/entities/user.entity';
import { Entity, Column, ManyToOne } from 'typeorm';

@Entity()
export class ListItemAttachment extends BaseEntity {
  @Column()
  fileName: string;

  @Column()
  fileUrl: string;

  @Column()
  fileKey: string;

  @Column()
  fileSize: number;

  @Column()
  mimeType: string;

  @ManyToOne(() => ListItem, { onDelete: 'CASCADE' })
  listItem: ListItem;

  @Column()
  listItemId: string;

  @ManyToOne(() => User)
  uploadedBy: User;

  @Column()
  uploadedById: string;
}