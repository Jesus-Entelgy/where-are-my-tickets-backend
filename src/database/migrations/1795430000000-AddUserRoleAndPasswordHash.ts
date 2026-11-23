import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRoleAndPasswordHash1795430000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      RENAME COLUMN "password" TO "password_hash"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "role" VARCHAR(20) NOT NULL DEFAULT 'USER'
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "CHK_users_role"
      CHECK ("role" IN ('USER', 'ADMIN'))
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP CONSTRAINT "CHK_users_role"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "role"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      RENAME COLUMN "password_hash" TO "password"
    `);
  }
}
