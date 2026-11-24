import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { UserRole } from '../users/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import type { AuthTokenPayload } from './jwt.strategy.js';

interface ProfileMeResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

interface AuthenticatedRequest extends Request {
  user: AuthTokenPayload;
}

@ApiTags('Profile')
@ApiBearerAuth()
@Controller('profile-me')
export class ProfileController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @ApiOkResponse({
    schema: {
      example: {
        id: 'user-id',
        email: 'ana@example.com',
        firstName: 'Ana',
        lastName: 'Garcia',
        role: UserRole.USER,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'A valid access token is required' })
  async getProfileMe(
    @Req() request: AuthenticatedRequest,
  ): Promise<ProfileMeResponse> {
    const user = await this.usersService.getByEmail(request.user.email);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }
}
