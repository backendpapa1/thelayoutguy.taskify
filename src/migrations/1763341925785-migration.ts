import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1763341925785 implements MigrationInterface {
    name = 'Migration1763341925785'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspace" ADD CONSTRAINT "UQ_e6ce28aa840b2278adc940e2f81" UNIQUE ("workspaceSlug")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspace" DROP CONSTRAINT "UQ_e6ce28aa840b2278adc940e2f81"`);
    }

}
