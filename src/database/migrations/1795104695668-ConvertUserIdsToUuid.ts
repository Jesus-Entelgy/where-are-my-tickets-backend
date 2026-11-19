import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ConvertUserIdsToUuid1795104695668 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_tickets_user_id"');
    await queryRunner.query(`
      ALTER TABLE "tickets"
      DROP CONSTRAINT "FK_tickets_user_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "id_uuid" UUID NOT NULL DEFAULT gen_random_uuid()
    `);
    await queryRunner.query(`
      ALTER TABLE "tickets"
      ADD COLUMN "user_id_uuid" UUID
    `);
    await queryRunner.query(`
      UPDATE "tickets" AS ticket
      SET "user_id_uuid" = "users"."id_uuid"
      FROM "users"
      WHERE "users"."id" = ticket."user_id"
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM "tickets"
          WHERE "user_id_uuid" IS NULL
        ) THEN
          RAISE EXCEPTION 'Could not map every ticket to a user UUID';
        END IF;
      END;
      $$
    `);
    await queryRunner.query(`
      ALTER TABLE "tickets"
      ALTER COLUMN "user_id_uuid" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP CONSTRAINT "PK_users_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "id"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      RENAME COLUMN "id_uuid" TO "id"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
    `);
    await queryRunner.query(`
      ALTER TABLE "tickets"
      DROP COLUMN "user_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "tickets"
      RENAME COLUMN "user_id_uuid" TO "user_id"
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
    await queryRunner.query('CREATE SEQUENCE "users_id_bigint_seq"');
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "id_bigint" BIGINT
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "id_bigint"
      SET DEFAULT nextval('"users_id_bigint_seq"')
    `);
    await queryRunner.query(`
      UPDATE "users"
      SET "id_bigint" = nextval('"users_id_bigint_seq"')
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "id_bigint" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER SEQUENCE "users_id_bigint_seq"
      OWNED BY "users"."id_bigint"
    `);
    await queryRunner.query(`
      ALTER TABLE "tickets"
      ADD COLUMN "user_id_bigint" BIGINT
    `);
    await queryRunner.query(`
      UPDATE "tickets" AS ticket
      SET "user_id_bigint" = "users"."id_bigint"
      FROM "users"
      WHERE "users"."id" = ticket."user_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "tickets"
      ALTER COLUMN "user_id_bigint" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP CONSTRAINT "PK_users_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "id"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      RENAME COLUMN "id_bigint" TO "id"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
    `);
    await queryRunner.query(`
      ALTER TABLE "tickets"
      DROP COLUMN "user_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "tickets"
      RENAME COLUMN "user_id_bigint" TO "user_id"
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
}
