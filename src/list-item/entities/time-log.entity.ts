// src/list-item/entities/time-log.entity.ts
import { BaseEntity } from 'src/_services/base/base.entity';
import { ListItem } from './list-item.entity';
import { User } from 'src/user/entities/user.entity';
import { Entity, Column, ManyToOne } from 'typeorm';

export enum TimeLogType {
  MANUAL = 'MANUAL',
  TIMER = 'TIMER',
  POMODORO = 'POMODORO',
}

@Entity()
export class TimeLog extends BaseEntity {
  @ManyToOne(() => ListItem, { onDelete: 'CASCADE' })
  listItem: ListItem;

  @Column()
  listItemId: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  userId: string;

  @Column({ type: 'int' })
  duration: number; // Duration in minutes

  @Column({
    type: 'enum',
    enum: TimeLogType,
    default: TimeLogType.MANUAL,
  })
  type: TimeLogType;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime?: Date;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ default: false })
  isPomodoroSession: boolean;
}