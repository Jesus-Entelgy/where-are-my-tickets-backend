import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { UserRole } from '../users/user.entity.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import type { AuthTokenPayload } from './jwt.strategy.js';

interface ProfileMeResponse {
  id: string;
  email: string;
  role: UserRole;
}

interface AuthenticatedRequest extends Request {
  user: AuthTokenPayload;
}

@ApiTags('Profile')
@Controller('profile-me')
export class ProfileController {
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @ApiOkResponse({
    schema: {
      example: {
        id: 'user-id',
        email: 'ana@example.com',
        role: UserRole.USER,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'A valid access token is required' })
  getProfileMe(@Req() request: AuthenticatedRequest): ProfileMeResponse {
    return {
      id: request.user.sub,
      email: request.user.email,
      role: request.user.role,
    };
  }
}
