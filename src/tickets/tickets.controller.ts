import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { TicketResponseDto } from './dto/ticket-response.dto.js';
import { UpdateTicketDto } from './dto/update-ticket.dto.js';
import { TicketsService } from './tickets.service.js';
import { UserRole } from '../users/user.entity.js';

@ApiTags('Tickets')
@ApiBearerAuth()
@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @ApiOperation({ summary: 'List the 50 most recently updated tickets' })
  @ApiOkResponse({ type: TicketResponseDto, isArray: true })
  getAll(): Promise<TicketResponseDto[]> {
    return this.ticketsService.getAll();
  }

  @Get('by-user/:userId')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'List tickets assigned to a user' })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiOkResponse({ type: TicketResponseDto, isArray: true })
  @ApiBadRequestResponse({ description: 'Invalid user ID' })
  @ApiNotFoundResponse({ description: 'User not found' })
  getByUserId(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<TicketResponseDto[]> {
    return this.ticketsService.getByUserId(userId);
  }

  @Get('by-title/:title')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Find a ticket by title' })
  @ApiParam({ name: 'title', example: 'Prepare sprint review' })
  @ApiOkResponse({ type: TicketResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid ticket title' })
  @ApiNotFoundResponse({ description: 'Ticket not found' })
  getByTitle(@Param('title') title: string): Promise<TicketResponseDto> {
    return this.ticketsService.getByTitle(title);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Find a ticket by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: TicketResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid ticket ID' })
  @ApiNotFoundResponse({ description: 'Ticket not found' })
  getById(@Param('id', ParseUUIDPipe) id: string): Promise<TicketResponseDto> {
    return this.ticketsService.getById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Update a ticket' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: TicketResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid ticket ID or update data' })
  @ApiConflictResponse({
    description: 'A ticket with this title already exists',
  })
  @ApiNotFoundResponse({ description: 'Ticket not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ): Promise<TicketResponseDto> {
    return this.ticketsService.update(id, updateTicketDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a ticket by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse()
  @ApiBadRequestResponse({ description: 'Invalid ticket ID' })
  @ApiNotFoundResponse({ description: 'Ticket not found' })
  deleteById(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.ticketsService.deleteById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Create a ticket' })
  @ApiCreatedResponse({ type: TicketResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid ticket data' })
  @ApiConflictResponse({
    description: 'A ticket with this title already exists',
  })
  create(@Body() createTicketDto: CreateTicketDto): Promise<TicketResponseDto> {
    return this.ticketsService.create(createTicketDto);
  }
}
