import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1763419346914 implements MigrationInterface {
    name = 'Migration1763419346914'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspace" ADD "icon" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspace" DROP COLUMN "icon"`);
    }

}
