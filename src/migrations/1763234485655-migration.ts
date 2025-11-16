import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1763234485655 implements MigrationInterface {
    name = 'Migration1763234485655'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspace" ADD "ownerId" uuid`);
        await queryRunner.query(`ALTER TABLE "workspace" ADD CONSTRAINT "FK_51f2194e4a415202512807d2f63" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspace" DROP CONSTRAINT "FK_51f2194e4a415202512807d2f63"`);
        await queryRunner.query(`ALTER TABLE "workspace" DROP COLUMN "ownerId"`);
    }

}
