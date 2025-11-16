import * as argon from 'argon2';
import { Injectable } from '@nestjs/common';

@Injectable()
export class HashService {
  async hashPassword(password: string): Promise<string> {
    return await argon.hash(password);
  }

  async verifyHash(hash:string, password: string): Promise<boolean> {
    return await argon.verify(hash, password);
  }
}
