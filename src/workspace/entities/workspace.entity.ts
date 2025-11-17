import { BaseEntity } from 'src/_services/base/base.entity';
import { User } from 'src/user/entities/user.entity';
import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { WorkspaceMember } from './workspace-member.entity';

@Entity()
export class Workspace extends BaseEntity {
  @Column()
  workspaceName: string;

  @Column()
  workspaceDesc: string;

  @Column({ unique: true })
  workspaceSlug: string;

  @Column({ default: false })
  isPrivate: boolean;

  @OneToMany(() => WorkspaceMember, (member) => member.workspace)
  members: WorkspaceMember[];

  @ManyToOne(() => User, (user) => user.id)
  owner: User;

  @Column({ default: 0, name: 'sortOrder' })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;
}
