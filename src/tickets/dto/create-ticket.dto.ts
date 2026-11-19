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

  @ApiProperty({ example: '1' })
  userId: string;
}
