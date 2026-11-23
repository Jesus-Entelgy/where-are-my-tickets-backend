import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { UsersService } from '../users/users.service.js';
import { AuthController } from './auth.controller.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { JwtStrategy } from './jwt.strategy.js';

describe('AuthController', () => {
  const jwtSecret = 'test-secret-with-at-least-32-bytes-long';
  let app: INestApplication<App>;
  let jwtService: JwtService;

  const usersService = {
    create: vi.fn(),
    login: vi.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({ secret: jwtSecret }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
      ],
      controllers: [AuthController],
      providers: [
        { provide: UsersService, useValue: usersService },
        JwtAuthGuard,
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => jwtSecret },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    jwtService = module.get<JwtService>(JwtService);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a user through POST /auth/register', async () => {
    usersService.create.mockResolvedValue({
      id: '1',
      email: 'ana@example.com',
      firstName: 'Ana',
      lastName: 'Garcia',
      role: 'USER',
    });

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'ana@example.com',
        password: 'password123',
        firstName: 'Ana',
        lastName: 'Garcia',
      })
      .expect(201)
      .expect({
        id: '1',
        email: 'ana@example.com',
        firstName: 'Ana',
        lastName: 'Garcia',
        role: 'USER',
      });

    expect(usersService.create).toHaveBeenCalledWith({
      email: 'ana@example.com',
      password: 'password123',
      firstName: 'Ana',
      lastName: 'Garcia',
    });
  });

  it('validates credentials through POST /auth/login', async () => {
    usersService.login.mockResolvedValue({
      id: '1',
      email: 'ana@example.com',
      firstName: 'Ana',
      lastName: 'Garcia',
      role: 'USER',
    });

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ana@example.com', password: 'password123' })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveProperty('access_token');
        expect(Object.keys(body)).toEqual(['access_token']);
      });

    await expect(
      jwtService.verifyAsync(response.body.access_token),
    ).resolves.toMatchObject({
      sub: '1',
      email: 'ana@example.com',
      role: 'USER',
    });

    expect(usersService.login).toHaveBeenCalledWith({
      email: 'ana@example.com',
      password: 'password123',
    });
  });

  it('returns 401 when credentials are invalid', async () => {
    usersService.login.mockRejectedValue(
      new UnauthorizedException('Email o contraseña incorrectos'),
    );

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ana@example.com', password: 'wrong-password' })
      .expect(401);
  });

  it('returns 200 for a valid token through POST /auth/logout', async () => {
    const token = await jwtService.signAsync({
      sub: '1',
      email: 'ana@example.com',
      role: 'USER',
    });

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('returns 401 for POST /auth/logout without a token', async () => {
    await request(app.getHttpServer()).post('/auth/logout').expect(401);
  });
});
