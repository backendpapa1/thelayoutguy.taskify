import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1763424587773 implements MigrationInterface {
    name = 'Migration1763424587773'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "workspace_list" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "title" character varying NOT NULL, "description" text, "workspaceId" uuid NOT NULL, "position" integer NOT NULL DEFAULT '0', "color" character varying NOT NULL DEFAULT '#6B7280', "isActive" boolean NOT NULL DEFAULT true, "createdById" uuid NOT NULL, "itemCount" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_4bbdfb71e05ea162c7d94f51e23" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_be220c30ac86d17434adfb2e79" ON "workspace_list" ("workspaceId", "position") `);
        await queryRunner.query(`ALTER TABLE "workspace_list" ADD CONSTRAINT "FK_a7189f17ba27898dac79cb87f51" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workspace_list" ADD CONSTRAINT "FK_4c1f394861c5dc94ffcaddd1e52" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspace_list" DROP CONSTRAINT "FK_4c1f394861c5dc94ffcaddd1e52"`);
        await queryRunner.query(`ALTER TABLE "workspace_list" DROP CONSTRAINT "FK_a7189f17ba27898dac79cb87f51"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_be220c30ac86d17434adfb2e79"`);
        await queryRunner.query(`DROP TABLE "workspace_list"`);
    }

}
