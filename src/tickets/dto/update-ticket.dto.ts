import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type TicketPriority,
  type TicketStatus,
} from '../ticket.entity.js';

export class UpdateTicketDto {
  @ApiPropertyOptional({ maxLength: 255, example: 'Prepare sprint review' })
  title?: string;

  @ApiPropertyOptional({ nullable: true, example: 'Review sprint outcomes' })
  description?: string | null;

  @ApiPropertyOptional({ enum: TICKET_PRIORITIES, example: 'HIGH' })
  priority?: TicketPriority;

  @ApiPropertyOptional({ enum: TICKET_STATUSES, example: 'OPEN' })
  status?: TicketStatus;
}
