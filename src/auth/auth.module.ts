import { Module } from '@nestjs/common';
import { AuthSecurityModule } from './auth-security.module.js';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { ProfileController } from './profile.controller.js';

@Module({
  imports: [UsersModule, AuthSecurityModule],
  controllers: [AuthController, ProfileController],
})
export class AuthModule {}
