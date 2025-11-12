
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class AccountService {
  constructor(@InjectQueue('account') private accountQueue: Queue) {}
}
