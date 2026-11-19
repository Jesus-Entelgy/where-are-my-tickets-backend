import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type TicketPriority,
  type TicketStatus,
} from '../ticket.entity.js';

export class CreateTicketDto {
  @ApiProperty({ maxLength: 255, example: 'Prepare sprint review' })
  title: string;

  @ApiPropertyOptional({ nullable: true, example: 'Review sprint outcomes' })
  description?: string | null;

  @ApiProperty({ enum: TICKET_PRIORITIES, example: 'HIGH' })
  priority: TicketPriority;

  @ApiProperty({ enum: TICKET_STATUSES, example: 'OPEN' })
  status: TicketStatus;

  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  userId: string;
}
