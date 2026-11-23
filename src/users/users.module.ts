import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSecurityModule } from '../auth/auth-security.module.js';
import { UsersController } from './users.controller.js';
import { User } from './user.entity.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [AuthSecurityModule, TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
