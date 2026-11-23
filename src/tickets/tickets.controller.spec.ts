import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { UserRole } from '../users/user.entity.js';
import { JwtStrategy } from '../auth/jwt.strategy.js';
import { TicketsController } from './tickets.controller.js';
import { TicketsService } from './tickets.service.js';

const JWT_SECRET = 'test-secret-with-at-least-32-bytes-long';
const TICKET_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '6ba7b810-9dad-41d1-80b4-00c04fd430c8';

describe('TicketsController authentication', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;

  const ticketsService = {
    getAll: vi.fn(),
    getByUserId: vi.fn(),
    getByTitle: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    deleteById: vi.fn(),
    create: vi.fn(),
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
      controllers: [TicketsController],
      providers: [
        JwtAuthGuard,
        RolesGuard,
        JwtStrategy,
        { provide: TicketsService, useValue: ticketsService },
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
    ticketsService.getAll.mockResolvedValue([]);
    ticketsService.getByUserId.mockResolvedValue([]);
    ticketsService.getByTitle.mockResolvedValue({ id: TICKET_ID });
    ticketsService.getById.mockResolvedValue({ id: TICKET_ID });
    ticketsService.update.mockResolvedValue({ id: TICKET_ID });
    ticketsService.deleteById.mockResolvedValue(undefined);
    ticketsService.create.mockResolvedValue({ id: TICKET_ID });
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects unauthenticated requests to every ticket endpoint', async () => {
    await request(app.getHttpServer()).get('/tickets').expect(401);
    await request(app.getHttpServer())
      .get(`/tickets/by-user/${USER_ID}`)
      .expect(401);
    await request(app.getHttpServer())
      .get('/tickets/by-title/test-ticket')
      .expect(401);
    await request(app.getHttpServer()).get(`/tickets/${TICKET_ID}`).expect(401);
    await request(app.getHttpServer())
      .patch(`/tickets/${TICKET_ID}`)
      .send({ title: 'Updated ticket' })
      .expect(401);
    await request(app.getHttpServer())
      .delete(`/tickets/${TICKET_ID}`)
      .expect(401);
    await request(app.getHttpServer())
      .post('/tickets')
      .send({
        title: 'New ticket',
        priority: 'HIGH',
        status: 'OPEN',
        userId: USER_ID,
      })
      .expect(401);

    expect(ticketsService.getAll).not.toHaveBeenCalled();
    expect(ticketsService.getByUserId).not.toHaveBeenCalled();
    expect(ticketsService.getByTitle).not.toHaveBeenCalled();
    expect(ticketsService.getById).not.toHaveBeenCalled();
    expect(ticketsService.update).not.toHaveBeenCalled();
    expect(ticketsService.deleteById).not.toHaveBeenCalled();
    expect(ticketsService.create).not.toHaveBeenCalled();
  });

  it('allows USER on designated routes but requires ADMIN on the others', async () => {
    const userToken = await jwtService.signAsync({
      sub: USER_ID,
      email: 'user@example.com',
      role: UserRole.USER,
    });

    await request(app.getHttpServer())
      .post('/tickets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'New ticket',
        priority: 'HIGH',
        status: 'OPEN',
        userId: USER_ID,
      })
      .expect(201);
    await request(app.getHttpServer())
      .get(`/tickets/by-user/${USER_ID}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .get('/tickets/by-title/test-ticket')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .get(`/tickets/${TICKET_ID}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/tickets/${TICKET_ID}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Updated ticket' })
      .expect(200);

    await request(app.getHttpServer())
      .get('/tickets')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .delete(`/tickets/${TICKET_ID}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);

    expect(ticketsService.getAll).not.toHaveBeenCalled();
    expect(ticketsService.deleteById).not.toHaveBeenCalled();
  });

  it('allows ADMIN on every ticket route', async () => {
    const adminToken = await jwtService.signAsync({
      sub: USER_ID,
      email: 'admin@example.com',
      role: UserRole.ADMIN,
    });

    await request(app.getHttpServer())
      .get('/tickets')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .get(`/tickets/by-user/${USER_ID}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .get('/tickets/by-title/test-ticket')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .get(`/tickets/${TICKET_ID}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/tickets/${TICKET_ID}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Updated ticket' })
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/tickets/${TICKET_ID}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
    await request(app.getHttpServer())
      .post('/tickets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'New ticket',
        priority: 'HIGH',
        status: 'OPEN',
        userId: USER_ID,
      })
      .expect(201);
  });
});
