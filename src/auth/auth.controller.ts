import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
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
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { isAuthTokenPayload } from './jwt.strategy.js';
import type { AuthTokenPayload } from './jwt.strategy.js';

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
  @ApiOkResponse({
    schema: {
      example: {
        user: {
          id: '1',
          email: 'ana@example.com',
          firstName: 'Ana',
          lastName: 'Garcia',
          role: 'USER',
        },
        access_token: 'xxxxx',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid login data' })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  async login(
    @Body() loginUserDto: LoginUserDto,
  ): Promise<{ user: UserResponseDto; access_token: string }> {
    const user = await this.usersService.login(loginUserDto);
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, access_token: accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Validate the access token before client-side logout',
  })
  @ApiOkResponse({
    description: 'The access token is valid. The client should discard it.',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing, invalid, or expired',
  })
  logout(): void {}

  @Post('refresh-access-token')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Return the access token or renew it if it has expired',
  })
  @ApiOkResponse({
    schema: { example: { access_token: 'xxxxx' } },
    description:
      'Returns the same token if it is valid, or a renewed token if it expired',
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing, invalid, or malformed',
  })
  async refreshAccessToken(
    @Headers('authorization') authorizationHeader: string | undefined,
  ): Promise<{ access_token: string }> {
    const [scheme, token, ...extraParts] = (authorizationHeader ?? '')
      .trim()
      .split(/\s+/);

    if (
      scheme?.toLowerCase() !== 'bearer' ||
      !token ||
      extraParts.length > 0
    ) {
      throw new UnauthorizedException('A Bearer access token is required');
    }

    let payload: Record<string, unknown>;
    try {
      payload = await this.jwtService.verifyAsync<Record<string, unknown>>(
        token,
        { ignoreExpiration: true, algorithms: ['HS256'] },
      );
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }

    if (
      !isAuthTokenPayload(payload) ||
      typeof payload.exp !== 'number' ||
      !Number.isFinite(payload.exp)
    ) {
      throw new UnauthorizedException('Invalid access token payload');
    }

    if (payload.exp > Math.floor(Date.now() / 1000)) {
      return { access_token: token };
    }

    const renewedToken = await this.jwtService.signAsync({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    } satisfies AuthTokenPayload);

    return { access_token: renewedToken };
  }
}
