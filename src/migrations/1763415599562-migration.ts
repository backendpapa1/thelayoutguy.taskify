import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1763415599562 implements MigrationInterface {
    name = 'Migration1763415599562'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."workspace_member_role_enum" AS ENUM('OWNER', 'ADMIN', 'MEMBER', 'GUEST')`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_member_status_enum" AS ENUM('ACTIVE', 'INVITED', 'SUSPENDED')`);
        await queryRunner.query(`CREATE TABLE "workspace_member" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "workspaceId" uuid NOT NULL, "userId" uuid NOT NULL, "role" "public"."workspace_member_role_enum" NOT NULL DEFAULT 'MEMBER', "status" "public"."workspace_member_status_enum" NOT NULL DEFAULT 'ACTIVE', "isOwner" boolean NOT NULL DEFAULT false, "joinedAt" TIMESTAMP, "invitedAt" TIMESTAMP, "invitedById" uuid, CONSTRAINT "PK_a3a35f64bf30517010551467c6e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "workspace_member" ADD CONSTRAINT "FK_15b622cbfffabc30d7dbc52fede" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workspace_member" ADD CONSTRAINT "FK_03ce416ae83c188274dec61205c" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workspace_member" ADD CONSTRAINT "FK_b9314196ac60f68218dc7942142" FOREIGN KEY ("invitedById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspace_member" DROP CONSTRAINT "FK_b9314196ac60f68218dc7942142"`);
        await queryRunner.query(`ALTER TABLE "workspace_member" DROP CONSTRAINT "FK_03ce416ae83c188274dec61205c"`);
        await queryRunner.query(`ALTER TABLE "workspace_member" DROP CONSTRAINT "FK_15b622cbfffabc30d7dbc52fede"`);
        await queryRunner.query(`DROP TABLE "workspace_member"`);
        await queryRunner.query(`DROP TYPE "public"."workspace_member_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."workspace_member_role_enum"`);
    }

}
