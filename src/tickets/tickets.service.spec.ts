import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Ticket } from './ticket.entity.js';
import { TicketsService } from './tickets.service.js';
import { UpdateTicketDto } from './dto/update-ticket.dto.js';
import { User } from '../users/user.entity.js';

describe('TicketsService', () => {
  let ticketsService: TicketsService;

  const ticketsRepository = {
    delete: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    findOneBy: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
  };

  const usersRepository = {
    findOne: vi.fn(),
  };

  const ticket = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Prepare sprint review',
    description: 'Review sprint outcomes',
    priority: 'HIGH' as const,
    status: 'OPEN' as const,
    userId: '1',
    createdAt: new Date('2026-11-19T10:00:00.000Z'),
    updatedAt: new Date('2026-11-19T11:00:00.000Z'),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    usersRepository.findOne.mockResolvedValue({ id: '1' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: getRepositoryToken(Ticket),
          useValue: ticketsRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
      ],
    }).compile();

    ticketsService = module.get<TicketsService>(TicketsService);
  });

  it('returns at most 50 tickets ordered by most recently updated', async () => {
    ticketsRepository.find.mockResolvedValue([ticket]);

    await expect(ticketsService.getAll()).resolves.toEqual([ticket]);
    expect(ticketsRepository.find).toHaveBeenCalledWith({
      order: { updatedAt: 'DESC' },
      take: 50,
    });
  });

  it('returns tickets assigned to an existing user', async () => {
    ticketsRepository.find.mockResolvedValue([ticket]);

    await expect(ticketsService.getByUserId('1')).resolves.toEqual([ticket]);
    expect(usersRepository.findOne).toHaveBeenCalledWith({
      where: { id: '1' },
      select: { id: true },
    });
    expect(ticketsRepository.find).toHaveBeenCalledWith({
      where: { userId: '1' },
      order: { updatedAt: 'DESC' },
    });
  });

  it('rejects invalid user IDs before querying the database', async () => {
    await expect(ticketsService.getByUserId('0')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(usersRepository.findOne).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the requested user does not exist', async () => {
    usersRepository.findOne.mockResolvedValue(null);

    await expect(ticketsService.getByUserId('2')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(ticketsRepository.find).not.toHaveBeenCalled();
  });

  it('finds a ticket by its trimmed title', async () => {
    ticketsRepository.findOne.mockResolvedValue(ticket);

    await expect(
      ticketsService.getByTitle(' Prepare sprint review '),
    ).resolves.toEqual(ticket);
    expect(ticketsRepository.findOne).toHaveBeenCalledWith({
      where: { title: 'Prepare sprint review' },
    });
  });

  it('throws NotFoundException when a ticket title is unknown', async () => {
    ticketsRepository.findOne.mockResolvedValue(null);

    await expect(
      ticketsService.getByTitle('Missing ticket'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('finds a ticket by ID', async () => {
    ticketsRepository.findOneBy.mockResolvedValue(ticket);

    await expect(ticketsService.getById(ticket.id)).resolves.toEqual(ticket);
    expect(ticketsRepository.findOneBy).toHaveBeenCalledWith({
      id: ticket.id,
    });
  });

  it('deletes an existing ticket', async () => {
    ticketsRepository.delete.mockResolvedValue({ affected: 1 });

    await expect(ticketsService.deleteById(ticket.id)).resolves.toBeUndefined();
    expect(ticketsRepository.delete).toHaveBeenCalledWith({ id: ticket.id });
  });

  it('throws NotFoundException when deleting an unknown ticket', async () => {
    ticketsRepository.delete.mockResolvedValue({ affected: 0 });

    await expect(ticketsService.deleteById(ticket.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('creates a ticket and defaults an omitted description to null', async () => {
    ticketsRepository.save.mockResolvedValue({ ...ticket, description: null });

    await expect(
      ticketsService.create({
        title: '  Prepare sprint review  ',
        priority: 'HIGH',
        status: 'OPEN',
        userId: '1',
      }),
    ).resolves.toEqual({ ...ticket, description: null });
    expect(ticketsRepository.save).toHaveBeenCalledWith({
      title: 'Prepare sprint review',
      description: null,
      priority: 'HIGH',
      status: 'OPEN',
      userId: '1',
    });
  });

  it('rejects an empty title', async () => {
    await expect(
      ticketsService.create({
        title: '   ',
        priority: 'HIGH',
        status: 'OPEN',
        userId: '1',
      }),
    ).rejects.toMatchObject({ status: 400 });
    expect(ticketsRepository.save).not.toHaveBeenCalled();
  });

  it('reports a conflict when the title already exists', async () => {
    ticketsRepository.save.mockRejectedValue(
      new QueryFailedError('INSERT INTO tickets', [], {
        code: '23505',
        constraint: 'UQ_tickets_title',
      }),
    );

    await expect(
      ticketsService.create({
        title: ticket.title,
        priority: 'HIGH',
        status: 'OPEN',
        userId: '1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects invalid user IDs when creating tickets', async () => {
    await expect(
      ticketsService.create({
        title: 'New ticket',
        priority: 'HIGH',
        status: 'OPEN',
        userId: '0',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(usersRepository.findOne).not.toHaveBeenCalled();
    expect(ticketsRepository.save).not.toHaveBeenCalled();
  });

  it('rejects unknown users when creating tickets', async () => {
    usersRepository.findOne.mockResolvedValue(null);

    await expect(
      ticketsService.create({
        title: 'New ticket',
        priority: 'HIGH',
        status: 'OPEN',
        userId: '2',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(ticketsRepository.save).not.toHaveBeenCalled();
  });

  it('updates only the provided fields and returns the updated ticket', async () => {
    const updatedTicket = { ...ticket, title: 'Updated sprint review' };
    ticketsRepository.update.mockResolvedValue({ affected: 1 });
    ticketsRepository.findOneBy.mockResolvedValue(updatedTicket);

    await expect(
      ticketsService.update(ticket.id, {
        title: '  Updated sprint review  ',
      }),
    ).resolves.toEqual(updatedTicket);
    expect(ticketsRepository.update).toHaveBeenCalledWith(
      { id: ticket.id },
      { title: 'Updated sprint review' },
    );
    expect(ticketsRepository.findOneBy).toHaveBeenCalledWith({
      id: ticket.id,
    });
  });

  it('rejects an empty update', async () => {
    await expect(ticketsService.update(ticket.id, {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(ticketsRepository.update).not.toHaveBeenCalled();
  });

  it('allows clearing the description with null', async () => {
    const updatedTicket = { ...ticket, description: null };
    ticketsRepository.update.mockResolvedValue({ affected: 1 });
    ticketsRepository.findOneBy.mockResolvedValue(updatedTicket);

    await expect(
      ticketsService.update(ticket.id, { description: null }),
    ).resolves.toEqual(updatedTicket);
    expect(ticketsRepository.update).toHaveBeenCalledWith(
      { id: ticket.id },
      { description: null },
    );
  });

  it('rejects unknown update fields', async () => {
    const input = Object.assign(new UpdateTicketDto(), { ownerId: 'user-id' });

    await expect(
      ticketsService.update(ticket.id, input),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(ticketsRepository.update).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when updating an unknown ticket', async () => {
    ticketsRepository.update.mockResolvedValue({ affected: 0 });

    await expect(
      ticketsService.update(ticket.id, { status: 'CLOSED' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('reports a conflict when updating to an existing title', async () => {
    ticketsRepository.update.mockRejectedValue(
      new QueryFailedError('UPDATE tickets', [], {
        code: '23505',
        constraint: 'UQ_tickets_title',
      }),
    );

    await expect(
      ticketsService.update(ticket.id, { title: 'Existing title' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
