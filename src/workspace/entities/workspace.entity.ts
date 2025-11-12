import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Workspace {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  workspaceName: string;

  @Column()
  workspaceDesc: string;

  @Column()
  workspaceSlug: string;

  @Column({ default: false })
  isPrivate: boolean;
}
