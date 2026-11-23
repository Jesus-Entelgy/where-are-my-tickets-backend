import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard.js';

@ApiTags('Profile')
@Controller('profile')
export class ProfileController {
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Check the authenticated profile endpoint' })
  @ApiOkResponse({ schema: { example: { message: 'Authenticated' } } })
  @ApiUnauthorizedResponse({ description: 'A valid access token is required' })
  getProfile(): { message: string } {
    return { message: 'Authenticated' };
  }
}
