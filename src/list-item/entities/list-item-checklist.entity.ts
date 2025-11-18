import { BaseEntity } from 'src/_services/base/base.entity';
import { ListItem } from './list-item.entity';
import { User } from 'src/user/entities/user.entity';
import { Entity, Column, ManyToOne } from 'typeorm';

@Entity()
export class ListItemChecklist extends BaseEntity {
  @Column()
  title: string;

  @ManyToOne(() => ListItem, { onDelete: 'CASCADE' })
  listItem: ListItem;

  @Column()
  listItemId: string;

  @Column({ type: 'int', default: 0 })
  position: number;

  @ManyToOne(() => User)
  createdBy: User;

  @Column()
  createdById: string;
}