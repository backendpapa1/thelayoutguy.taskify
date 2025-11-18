// src/list-item/entities/list-item-comment.entity.ts
import { BaseEntity } from 'src/_services/base/base.entity';
import { ListItem } from './list-item.entity';
import { User } from 'src/user/entities/user.entity';
import { Entity, Column, ManyToOne } from 'typeorm';

@Entity()
export class ListItemComment extends BaseEntity {
  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => ListItem, { onDelete: 'CASCADE' })
  listItem: ListItem;

  @Column()
  listItemId: string;

  @ManyToOne(() => User)
  author: User;

  @Column()
  authorId: string;

  @Column({ default: false })
  isEdited: boolean;

  @Column({ type: 'timestamp', nullable: true })
  editedAt?: Date;
}