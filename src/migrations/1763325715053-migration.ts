import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1763325715053 implements MigrationInterface {
    name = 'Migration1763325715053'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspace" ADD "sortOrder" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "workspace" ADD "isActive" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspace" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "workspace" DROP COLUMN "sortOrder"`);
    }

}
