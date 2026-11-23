import {
  Controller,
  Get,
  INestApplication,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthGuard, PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AuthTokenPayload, JwtStrategy } from './jwt.strategy.js';

const JWT_SECRET = 'test-secret-with-at-least-32-bytes-long';

@Controller('strategy-test')
class StrategyTestController {
  @Get()
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Req() request: { user: AuthTokenPayload }): AuthTokenPayload {
    return request.user;
  }
}

describe('JwtStrategy', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({ secret: JWT_SECRET }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
      ],
      controllers: [StrategyTestController],
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => JWT_SECRET },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    jwtService = module.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('extracts and validates a Bearer token', async () => {
    const payload: AuthTokenPayload = {
      sub: 'user-id',
      email: 'ana@example.com',
      role: 'USER',
    };
    const token = await jwtService.signAsync(payload);

    await request(app.getHttpServer())
      .get('/strategy-test')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(payload);
  });

  it('rejects a request without a Bearer token', async () => {
    await request(app.getHttpServer()).get('/strategy-test').expect(401);
  });
});
