import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { TicketResponseDto } from './dto/ticket-response.dto.js';
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type TicketPriority,
  type TicketStatus,
} from './ticket.entity.js';
import { Ticket } from './ticket.entity.js';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketsRepository: Repository<Ticket>,
  ) {}

  async getAll(): Promise<TicketResponseDto[]> {
    const tickets = await this.ticketsRepository.find({
      order: { updatedAt: 'DESC' },
      take: 50,
    });

    return tickets.map((ticket) => this.toResponse(ticket));
  }

  async getByTitle(title: string): Promise<TicketResponseDto> {
    const normalizedTitle = title.trim();
    if (normalizedTitle.length === 0) {
      throw new BadRequestException('Invalid ticket title');
    }

    const ticket = await this.ticketsRepository.findOne({
      where: { title: normalizedTitle },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return this.toResponse(ticket);
  }

  async getById(id: string): Promise<TicketResponseDto> {
    const ticket = await this.ticketsRepository.findOneBy({ id });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return this.toResponse(ticket);
  }

  async deleteById(id: string): Promise<void> {
    const result = await this.ticketsRepository.delete({ id });

    if (result.affected === 0) {
      throw new NotFoundException('Ticket not found');
    }

    if (result.affected !== 1) {
      throw new Error('Ticket deletion was not confirmed');
    }
  }

  async create(input: CreateTicketDto): Promise<TicketResponseDto> {
    const ticketInput = this.validateAndNormalize(input);

    try {
      const ticket = await this.ticketsRepository.save(ticketInput);
      return this.toResponse(ticket);
    } catch (error) {
      if (this.isTitleUniqueViolation(error)) {
        throw new ConflictException(
          'Ya existe un ticket con ese título',
        );
      }

      throw error;
    }
  }

  private validateAndNormalize(input: CreateTicketDto): CreateTicketDto {
    if (
      typeof input !== 'object' ||
      input === null ||
      typeof input.title !== 'string' ||
      !this.isTicketPriority(input.priority) ||
      !this.isTicketStatus(input.status) ||
      (input.description !== undefined &&
        input.description !== null &&
        typeof input.description !== 'string')
    ) {
      throw new BadRequestException('Invalid ticket data');
    }

    const title = input.title.trim();
    if (title.length === 0 || title.length > 255) {
      throw new BadRequestException('Invalid ticket data');
    }

    return {
      title,
      description: input.description ?? null,
      priority: input.priority,
      status: input.status,
    };
  }

  private isTicketPriority(value: unknown): value is TicketPriority {
    return TICKET_PRIORITIES.some((priority) => priority === value);
  }

  private isTicketStatus(value: unknown): value is TicketStatus {
    return TICKET_STATUSES.some((status) => status === value);
  }

  private isTitleUniqueViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError: unknown = error.driverError;
    return (
      typeof driverError === 'object' &&
      driverError !== null &&
      'code' in driverError &&
      driverError.code === '23505' &&
      'constraint' in driverError &&
      driverError.constraint === 'UQ_tickets_title'
    );
  }

  private toResponse(ticket: Ticket): TicketResponseDto {
    return {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    };
  }
}
