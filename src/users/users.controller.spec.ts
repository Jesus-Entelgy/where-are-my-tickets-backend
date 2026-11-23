import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { JwtStrategy } from '../auth/jwt.strategy.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { UserRole } from './user.entity.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

const JWT_SECRET = 'test-secret-with-at-least-32-bytes-long';
const USER_ID = '6ba7b810-9dad-41d1-80b4-00c04fd430c8';

describe('UsersController', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;

  const usersService = {
    create: vi.fn(),
    login: vi.fn(),
    getAll: vi.fn(),
    getByEmail: vi.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: JWT_SECRET,
          signOptions: { expiresIn: '15m' },
        }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
      ],
      controllers: [UsersController],
      providers: [
        JwtAuthGuard,
        JwtStrategy,
        RolesGuard,
        { provide: UsersService, useValue: usersService },
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

  beforeEach(() => {
    vi.clearAllMocks();
    usersService.getAll.mockResolvedValue([]);
    usersService.getByEmail.mockResolvedValue({
      id: USER_ID,
      email: 'ana@example.com',
      firstName: 'Ana',
      lastName: 'Garcia',
      role: UserRole.ADMIN,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('keeps GET /users available', async () => {
    await request(app.getHttpServer()).get('/users').expect(200).expect([]);
  });

  it('allows only an authenticated ADMIN to view a user by email', async () => {
    const userToken = await jwtService.signAsync({
      sub: USER_ID,
      email: 'user@example.com',
      role: UserRole.USER,
    });
    const adminToken = await jwtService.signAsync({
      sub: USER_ID,
      email: 'admin@example.com',
      role: UserRole.ADMIN,
    });

    await request(app.getHttpServer())
      .get('/users/by-email/ana%40example.com')
      .expect(401);

    await request(app.getHttpServer())
      .get('/users/by-email/ana%40example.com')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
    expect(usersService.getByEmail).not.toHaveBeenCalled();

    await request(app.getHttpServer())
      .get('/users/by-email/ana%40example.com')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect({
        id: USER_ID,
        email: 'ana@example.com',
        firstName: 'Ana',
        lastName: 'Garcia',
        role: UserRole.ADMIN,
      });

    expect(usersService.getByEmail).toHaveBeenCalledWith('ana@example.com');
  });

  it('does not expose user registration at POST /users', async () => {
    await request(app.getHttpServer()).post('/users').send({}).expect(404);
    expect(usersService.create).not.toHaveBeenCalled();
  });

  it('does not expose login at POST /users/login', async () => {
    await request(app.getHttpServer())
      .post('/users/login')
      .send({})
      .expect(404);
    expect(usersService.login).not.toHaveBeenCalled();
  });
});
