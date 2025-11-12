import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

interface IAuthMethod {
  providerId?: string;
  providerEmail?: string;
  providerUsername?: string;
  providerPassword?: string;
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ default: true })
  isAccountActive: boolean;

  @Column()
  email: string;

  @Column('simple-array')
  isAccountSetup: { version: string; status: false };

  @Column('simple-array')
  authMethod: IAuthMethod[];
}
