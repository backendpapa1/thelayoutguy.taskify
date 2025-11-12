import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';


export interface IAuthMethod {
  providerId?: string;
  providerEmail?: string;
  providerUsername?: string;
  providerPassword?: string;
  type: /*'EMAIL' | 'GOOGLE' | 'X' | */ string;
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: true })
  isAccountActive: boolean;

  @Column()
  email: string;

  @Column('simple-json')
  isAccountSetup: { version: string; status: false };

  @Column('json')
  authMethods: IAuthMethod[];
}
