import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTickets1795090738503 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tickets" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "title" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "priority" VARCHAR(20) NOT NULL,
        "status" VARCHAR(20) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_tickets_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_tickets_priority" CHECK ("priority" IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
        CONSTRAINT "CHK_tickets_status" CHECK ("status" IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'))
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "tickets"');
  }
}
