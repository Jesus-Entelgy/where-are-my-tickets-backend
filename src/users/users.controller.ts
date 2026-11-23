import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UserResponseDto } from './dto/user-response.dto.js';
import { UsersService } from './users.service.js';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users' })
  @ApiOkResponse({ type: UserResponseDto, isArray: true })
  getAll(): Promise<UserResponseDto[]> {
    return this.usersService.getAll();
  }

  @Get('by-email/:email')
  @ApiOperation({ summary: 'Find a user by email' })
  @ApiParam({ name: 'email', example: 'ana@example.com' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  getByEmail(@Param('email') email: string): Promise<UserResponseDto> {
    return this.usersService.getByEmail(email);
  }
}
