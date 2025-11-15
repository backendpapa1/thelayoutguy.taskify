import { BaseEntity } from 'src/_services/base/base.entity';
import { Workspace } from 'src/workspace/entities/workspace.entity';
import { Entity, Column, OneToMany } from 'typeorm';

export interface IAuthMethod {
  providerId?: string;
  providerEmail?: string;
  providerUsername?: string;
  providerPassword?: string;
  type: /*'EMAIL' | 'GOOGLE' | 'X' | */ string;
}

@Entity()
export class User extends BaseEntity {
  @Column()
  name: string;

  @Column({ default: true })
  isAccountActive: boolean;

  @Column()
  email: string;

  @Column({ default: false })
  isAccountSetup: boolean;

  @Column('json')
  authMethods: IAuthMethod[];

  @OneToMany(() => Workspace, (workspace) => workspace.owner)
  workspaces: Workspace[];
}
