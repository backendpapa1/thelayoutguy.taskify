import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1763232191106 implements MigrationInterface {
    name = 'Migration1763232191106'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isAccountSetup"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "isAccountSetup" boolean NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isAccountSetup"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "isAccountSetup" text NOT NULL`);
    }

}
