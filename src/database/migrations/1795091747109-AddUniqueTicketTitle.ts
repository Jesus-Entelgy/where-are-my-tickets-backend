import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueTicketTitle1795091747109 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tickets"
      ADD CONSTRAINT "UQ_tickets_title" UNIQUE ("title")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tickets"
      DROP CONSTRAINT "UQ_tickets_title"
    `);
  }
}
