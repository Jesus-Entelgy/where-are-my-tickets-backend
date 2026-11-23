import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { UsersService } from '../users/users.service.js';
import { AuthController } from './auth.controller.js';

describe('AuthController', () => {
  let app: INestApplication<App>;

  const usersService = {
    create: vi.fn(),
    login: vi.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    app = module.createNestApplication();
    await app.init();
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

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ana@example.com', password: 'password123' })
      .expect(200)
      .expect({ message: 'Login correcto' });

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
});
