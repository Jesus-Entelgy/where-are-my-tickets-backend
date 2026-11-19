import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Ticket } from './ticket.entity.js';
import { TicketsService } from './tickets.service.js';

describe('TicketsService', () => {
  let ticketsService: TicketsService;

  const ticketsRepository = {
    delete: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    findOneBy: vi.fn(),
    save: vi.fn(),
  };

  const ticket = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Prepare sprint review',
    description: 'Review sprint outcomes',
    priority: 'HIGH' as const,
    status: 'OPEN' as const,
    createdAt: new Date('2026-11-19T10:00:00.000Z'),
    updatedAt: new Date('2026-11-19T11:00:00.000Z'),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: getRepositoryToken(Ticket),
          useValue: ticketsRepository,
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

    await expect(
      ticketsService.deleteById(ticket.id),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates a ticket and defaults an omitted description to null', async () => {
    ticketsRepository.save.mockResolvedValue({ ...ticket, description: null });

    await expect(
      ticketsService.create({
        title: '  Prepare sprint review  ',
        priority: 'HIGH',
        status: 'OPEN',
      }),
    ).resolves.toEqual({ ...ticket, description: null });
    expect(ticketsRepository.save).toHaveBeenCalledWith({
      title: 'Prepare sprint review',
      description: null,
      priority: 'HIGH',
      status: 'OPEN',
    });
  });

  it('rejects an empty title', async () => {
    await expect(
      ticketsService.create({
        title: '   ',
        priority: 'HIGH',
        status: 'OPEN',
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
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
