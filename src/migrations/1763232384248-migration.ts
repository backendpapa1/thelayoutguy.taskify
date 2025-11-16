import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1763232384248 implements MigrationInterface {
    name = 'Migration1763232384248'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "isAccountSetup" SET DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "isAccountSetup" DROP DEFAULT`);
    }

}
