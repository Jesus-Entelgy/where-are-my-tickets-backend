import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { User } from '../users/user.entity.js';
import { Ticket } from './ticket.entity.js';
import { TicketsController } from './tickets.controller.js';
import { TicketsService } from './tickets.service.js';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Ticket, User])],
  providers: [TicketsService],
  controllers: [TicketsController],
})
export class TicketsModule {}
