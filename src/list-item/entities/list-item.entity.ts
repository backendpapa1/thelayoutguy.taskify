// src/list-item/entities/list-item.entity.ts
import { BaseEntity } from 'src/_services/base/base.entity';
import { WorkspaceList } from 'src/workspace-list/entities/workspace-list.entity';
import { User } from 'src/user/entities/user.entity';
import { Entity, Column, ManyToOne, ManyToMany, JoinTable, Index } from 'typeorm';

export enum ListItemPriority {
  NONE = 'NONE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum ListItemStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  ARCHIVED = 'ARCHIVED',
}

@Entity()
@Index(['list', 'position'])
@Index(['list', 'status'])
export class ListItem extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToOne(() => WorkspaceList, { onDelete: 'CASCADE' })
  list: WorkspaceList;

  @Column()
  listId: string;

  @Column({ type: 'int', default: 0 })
  position: number; 

  @Column({
    type: 'enum',
    enum: ListItemPriority,
    default: ListItemPriority.NONE,
  })
  priority: ListItemPriority;

  @Column({
    type: 'enum',
    enum: ListItemStatus,
    default: ListItemStatus.TODO,
  })
  status: ListItemStatus;

  
  @ManyToMany(() => User)
  @JoinTable({
    name: 'list_item_assignees',
    joinColumn: { name: 'listItemId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  assignees: User[];

  @ManyToOne(() => User)
  createdBy: User;

  @Column()
  createdById: string;

  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date;

  @Column({ default: false })
  isOverdue: boolean;

  @Column({ type: 'simple-array', nullable: true })
  labels?: string[];

  @Column({ nullable: true })
  coverImage?: string;

  @Column({ type: 'int', default: 0 })
  checklistItemsTotal: number;

  @Column({ type: 'int', default: 0 })
  checklistItemsCompleted: number;

  @Column({ type: 'int', default: 0 })
  commentsCount: number;

  @Column({ type: 'int', default: 0 })
  attachmentsCount: number;

  @Column({ type: 'int', default: 0 })
  estimatedTime?: number; 

  @Column({ type: 'int', default: 0 })
  trackedTime: number; 

  @Column({ type: 'int', default: 25 })
  pomodoroWorkDuration: number;

  @Column({ type: 'int', default: 5 })
  pomodoroBreakDuration: number; 

  @Column({ type: 'int', default: 0 })
  pomodoroCompletedSessions: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  archivedAt?: Date;
}