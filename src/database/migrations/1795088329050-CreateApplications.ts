import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateApplications1795088329050 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "applications" (
        "id" VARCHAR(32) NOT NULL DEFAULT md5(gen_random_uuid()::text),
        "name" VARCHAR(100) NOT NULL,
        CONSTRAINT "PK_applications_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_applications_name" UNIQUE ("name")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "applications"');
  }
}
