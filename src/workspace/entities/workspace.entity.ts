import { BaseEntity } from 'src/_services/base/base.entity';
import { User } from 'src/user/entities/user.entity';
import { Entity, Column, ManyToOne } from 'typeorm';

@Entity()
export class Workspace extends BaseEntity {
  @Column()
  workspaceName: string;

  @Column()
  workspaceDesc: string;

  @Column()
  workspaceSlug: string;

  @Column({ default: false })
  isPrivate: boolean;

  @ManyToOne(() => User, (user) => user.id)
  owner: User;
}
