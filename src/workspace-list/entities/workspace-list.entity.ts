import { BaseEntity } from 'src/_services/base/base.entity';
import { Workspace } from 'src/workspace/entities/workspace.entity';
import { User } from 'src/user/entities/user.entity';
import { Entity, Column, ManyToOne, Index } from 'typeorm';

@Entity()
@Index(['workspace', 'position'])
export class WorkspaceList extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  workspace: Workspace;

  @Column()
  workspaceId: string;

  @Column({ type: 'int', default: 0 })
  position: number; 

  @Column({ default: '#6B7280' }) 
  color?: string; 

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => User)
  createdBy: User;

  @Column()
  createdById: string;

  @Column({ type: 'int', default: 0 })
  itemCount: number;
}