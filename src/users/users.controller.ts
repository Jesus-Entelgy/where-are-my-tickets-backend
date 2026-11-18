import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto.js';
import { LoginUserDto } from './dto/login-user.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { UsersService } from './users.service.js';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Register a user' })
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid user data' })
  @ApiConflictResponse({ description: 'The email is already registered' })
  create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in a user with email and password' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid login data' })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  login(@Body() loginUserDto: LoginUserDto): Promise<UserResponseDto> {
    return this.usersService.login(loginUserDto);
  }

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
