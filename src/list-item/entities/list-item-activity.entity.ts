// src/list-item/entities/list-item-activity.entity.ts
import { BaseEntity } from 'src/_services/base/base.entity';
import { ListItem } from './list-item.entity';
import { User } from 'src/user/entities/user.entity';
import { Entity, Column, ManyToOne, Index } from 'typeorm';

export enum ActivityType {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  MOVED = 'MOVED',
  ASSIGNED = 'ASSIGNED',
  UNASSIGNED = 'UNASSIGNED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  ATTACHMENT_ADDED = 'ATTACHMENT_ADDED',
  ATTACHMENT_DELETED = 'ATTACHMENT_DELETED',
  CHECKLIST_ADDED = 'CHECKLIST_ADDED',
  CHECKLIST_ITEM_CHECKED = 'CHECKLIST_ITEM_CHECKED',
  CHECKLIST_ITEM_UNCHECKED = 'CHECKLIST_ITEM_UNCHECKED',
  DUE_DATE_CHANGED = 'DUE_DATE_CHANGED',
  PRIORITY_CHANGED = 'PRIORITY_CHANGED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  TIME_LOGGED = 'TIME_LOGGED',
  POMODORO_COMPLETED = 'POMODORO_COMPLETED',
  ARCHIVED = 'ARCHIVED',
  RESTORED = 'RESTORED',
}

@Entity()
@Index(['listItem', 'createdAt'])
export class ListItemActivity extends BaseEntity {
  @ManyToOne(() => ListItem, { onDelete: 'CASCADE' })
  listItem: ListItem;

  @Column()
  listItemId: string;

  @Column({
    type: 'enum',
    enum: ActivityType,
  })
  type: ActivityType;

  @Column({ type: 'text' })
  description: string; 

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any; 

  @ManyToOne(() => User)
  user: User;

  @Column()
  userId: string;
}