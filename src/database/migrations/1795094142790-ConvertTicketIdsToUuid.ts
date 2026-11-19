import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ConvertTicketIdsToUuid1795094142790 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE
        id_data_type TEXT;
      BEGIN
        SELECT "data_type"
        INTO id_data_type
        FROM "information_schema"."columns"
        WHERE "table_schema" = current_schema()
          AND "table_name" = 'tickets'
          AND "column_name" = 'id';

        IF id_data_type IS NULL THEN
          RAISE EXCEPTION 'Column tickets.id does not exist';
        END IF;

        IF id_data_type <> 'uuid' THEN
          ALTER TABLE "tickets" ALTER COLUMN "id" DROP IDENTITY IF EXISTS;
          ALTER TABLE "tickets" ALTER COLUMN "id" DROP DEFAULT;
          ALTER TABLE "tickets"
            ALTER COLUMN "id" TYPE UUID USING gen_random_uuid();
        END IF;

        ALTER TABLE "tickets"
          ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
      END;
      $$
    `);
  }

  async down(): Promise<void> {
    throw new Error(
      'Ticket IDs cannot be converted back because the previous numeric IDs are not recoverable.',
    );
  }
}
