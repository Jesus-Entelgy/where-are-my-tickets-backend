import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello Entelgy! This is the Where Are My Tickets application.';
  }
}
