import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export const TICKET_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export const TICKET_STATUSES = [
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
] as const;

export type TicketPriority = (typeof TICKET_PRIORITIES)[number];
export type TicketStatus = (typeof TICKET_STATUSES)[number];

@Entity({ name: 'tickets' })
@Check(
  'CHK_tickets_priority',
  `"priority" IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')`,
)
@Check(
  'CHK_tickets_status',
  `"status" IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')`,
)
@Unique('UQ_tickets_title', ['title'])
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 20, nullable: false })
  priority: TicketPriority;

  @Column({ type: 'varchar', length: 20, nullable: false })
  status: TicketStatus;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
