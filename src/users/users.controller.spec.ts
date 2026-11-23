import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';

describe('UsersController', () => {
  let app: INestApplication<App>;

  const usersService = {
    create: vi.fn(),
    login: vi.fn(),
    getAll: vi.fn(),
    getByEmail: vi.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
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

  it('keeps GET /users available', async () => {
    usersService.getAll.mockResolvedValue([]);

    await request(app.getHttpServer()).get('/users').expect(200).expect([]);
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
