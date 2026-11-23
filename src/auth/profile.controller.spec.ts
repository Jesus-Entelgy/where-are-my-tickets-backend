import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { UserRole } from '../users/user.entity.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { ProfileController } from './profile.controller.js';
import { JwtStrategy } from './jwt.strategy.js';

const JWT_SECRET = 'test-secret-with-at-least-32-bytes-long';

describe('ProfileController', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: JWT_SECRET,
          signOptions: { expiresIn: '15m' },
        }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
      ],
      controllers: [ProfileController],
      providers: [
        JwtAuthGuard,
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

  it('returns 401 when no access token is provided', async () => {
    await request(app.getHttpServer()).get('/profile').expect(401);
  });

  it('allows access with a valid Bearer token', async () => {
    const accessToken = await jwtService.signAsync({
      sub: 'user-id',
      email: 'ana@example.com',
      role: UserRole.USER,
    });

    await request(app.getHttpServer())
      .get('/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect({ message: 'Authenticated' });
  });

  it('returns 401 when the token signature is invalid', async () => {
    const invalidTokenService = new JwtService({ secret: 'different-secret' });
    const accessToken = await invalidTokenService.signAsync({
      sub: 'user-id',
      email: 'ana@example.com',
      role: UserRole.USER,
    });

    await request(app.getHttpServer())
      .get('/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);
  });
});
