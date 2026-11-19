import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTicketUser1795103403598 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('TRUNCATE TABLE "tickets"');
    await queryRunner.query(`
      ALTER TABLE "tickets"
      ADD COLUMN "user_id" BIGINT NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "tickets"
      ADD CONSTRAINT "FK_tickets_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_tickets_user_id" ON "tickets" ("user_id")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_tickets_user_id"');
    await queryRunner.query(`
      ALTER TABLE "tickets"
      DROP CONSTRAINT "FK_tickets_user_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "tickets"
      DROP COLUMN "user_id"
    `);
  }
}
