// src/list-item/entities/checklist-item.entity.ts
import { BaseEntity } from 'src/_services/base/base.entity';
import { ListItemChecklist } from './list-item-checklist.entity';
import { User } from 'src/user/entities/user.entity';
import { Entity, Column, ManyToOne } from 'typeorm';

@Entity()
export class ChecklistItem extends BaseEntity {
  @Column()
  content: string;

  @Column({ default: false })
  isCompleted: boolean;

  @ManyToOne(() => ListItemChecklist, { onDelete: 'CASCADE' })
  checklist: ListItemChecklist;

  @Column()
  checklistId: string;

  @Column({ type: 'int', default: 0 })
  position: number;

  @ManyToOne(() => User, { nullable: true })
  completedBy?: User;

  @Column({ nullable: true })
  completedById?: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;
}