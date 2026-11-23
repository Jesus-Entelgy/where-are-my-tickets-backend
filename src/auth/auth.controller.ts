import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../users/dto/create-user.dto.js';
import { LoginUserDto } from '../users/dto/login-user.dto.js';
import { UserResponseDto } from '../users/dto/user-response.dto.js';
import { UsersService } from '../users/users.service.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a user' })
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid user data' })
  @ApiConflictResponse({ description: 'The email is already registered' })
  register(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in a user with email and password' })
  @ApiOkResponse({ schema: { example: { access_token: 'xxxxx' } } })
  @ApiBadRequestResponse({ description: 'Invalid login data' })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  async login(
    @Body() loginUserDto: LoginUserDto,
  ): Promise<{ access_token: string }> {
    const user = await this.usersService.login(loginUserDto);
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { access_token: accessToken };
  }
}
