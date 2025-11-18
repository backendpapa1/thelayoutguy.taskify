import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1763496964278 implements MigrationInterface {
    name = 'Migration1763496964278'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."list_item_priority_enum" AS ENUM('NONE', 'LOW', 'MEDIUM', 'HIGH', 'URGENT')`);
        await queryRunner.query(`CREATE TYPE "public"."list_item_status_enum" AS ENUM('TODO', 'IN_PROGRESS', 'DONE', 'ARCHIVED')`);
        await queryRunner.query(`CREATE TABLE "list_item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "title" character varying NOT NULL, "description" text, "listId" uuid NOT NULL, "position" integer NOT NULL DEFAULT '0', "priority" "public"."list_item_priority_enum" NOT NULL DEFAULT 'NONE', "status" "public"."list_item_status_enum" NOT NULL DEFAULT 'TODO', "createdById" uuid NOT NULL, "dueDate" TIMESTAMP, "isOverdue" boolean NOT NULL DEFAULT false, "labels" text, "coverImage" character varying, "checklistItemsTotal" integer NOT NULL DEFAULT '0', "checklistItemsCompleted" integer NOT NULL DEFAULT '0', "commentsCount" integer NOT NULL DEFAULT '0', "attachmentsCount" integer NOT NULL DEFAULT '0', "estimatedTime" integer NOT NULL DEFAULT '0', "trackedTime" integer NOT NULL DEFAULT '0', "pomodoroWorkDuration" integer NOT NULL DEFAULT '25', "pomodoroBreakDuration" integer NOT NULL DEFAULT '5', "pomodoroCompletedSessions" integer NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, "archivedAt" TIMESTAMP, CONSTRAINT "PK_c8ce68170d7087b09ae88f85432" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_52b325de0549bfb4242656660f" ON "list_item" ("listId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_c541e74b13bca8df5eaaca1a13" ON "list_item" ("listId", "position") `);
        await queryRunner.query(`CREATE TYPE "public"."time_log_type_enum" AS ENUM('MANUAL', 'TIMER', 'POMODORO')`);
        await queryRunner.query(`CREATE TABLE "time_log" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "listItemId" uuid NOT NULL, "userId" uuid NOT NULL, "duration" integer NOT NULL, "type" "public"."time_log_type_enum" NOT NULL DEFAULT 'MANUAL', "startTime" TIMESTAMP NOT NULL, "endTime" TIMESTAMP, "note" text, "isPomodoroSession" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_b74817f73944f78f239601069f2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "list_item_comment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "content" text NOT NULL, "listItemId" uuid NOT NULL, "authorId" uuid NOT NULL, "isEdited" boolean NOT NULL DEFAULT false, "editedAt" TIMESTAMP, CONSTRAINT "PK_09944134e9e3157b8143613cf25" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "list_item_checklist" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "title" character varying NOT NULL, "listItemId" uuid NOT NULL, "position" integer NOT NULL DEFAULT '0', "createdById" uuid NOT NULL, CONSTRAINT "PK_194e932a788fa81af7780d5646e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "list_item_attachment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "fileName" character varying NOT NULL, "fileUrl" character varying NOT NULL, "fileKey" character varying NOT NULL, "fileSize" integer NOT NULL, "mimeType" character varying NOT NULL, "listItemId" uuid NOT NULL, "uploadedById" uuid NOT NULL, CONSTRAINT "PK_0cecf28896b646d74b187549c37" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."list_item_activity_type_enum" AS ENUM('CREATED', 'UPDATED', 'MOVED', 'ASSIGNED', 'UNASSIGNED', 'COMMENT_ADDED', 'ATTACHMENT_ADDED', 'ATTACHMENT_DELETED', 'CHECKLIST_ADDED', 'CHECKLIST_ITEM_CHECKED', 'CHECKLIST_ITEM_UNCHECKED', 'DUE_DATE_CHANGED', 'PRIORITY_CHANGED', 'STATUS_CHANGED', 'TIME_LOGGED', 'POMODORO_COMPLETED', 'ARCHIVED', 'RESTORED')`);
        await queryRunner.query(`CREATE TABLE "list_item_activity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "listItemId" uuid NOT NULL, "type" "public"."list_item_activity_type_enum" NOT NULL, "description" text NOT NULL, "metadata" jsonb, "userId" uuid NOT NULL, CONSTRAINT "PK_7b80f966c5aef3c01fc9815051c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c0964cc6b8e41ab559fd0098b3" ON "list_item_activity" ("listItemId", "createdAt") `);
        await queryRunner.query(`CREATE TABLE "checklist_item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "content" character varying NOT NULL, "isCompleted" boolean NOT NULL DEFAULT false, "checklistId" uuid NOT NULL, "position" integer NOT NULL DEFAULT '0', "completedById" uuid, "completedAt" TIMESTAMP, CONSTRAINT "PK_0c52d9590c766a9ae718e16cebf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "list_item_assignees" ("listItemId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_06937f235b4ccfa3e5f3587e50c" PRIMARY KEY ("listItemId", "userId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_add505e049183b0b3f3901181b" ON "list_item_assignees" ("listItemId") `);
        await queryRunner.query(`CREATE INDEX "IDX_0906924393d423b51b85cce758" ON "list_item_assignees" ("userId") `);
        await queryRunner.query(`ALTER TABLE "list_item" ADD CONSTRAINT "FK_89a46892e58c831d817b2dca8f7" FOREIGN KEY ("listId") REFERENCES "workspace_list"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "list_item" ADD CONSTRAINT "FK_986ced3779f3ea553215e347503" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "time_log" ADD CONSTRAINT "FK_30748ff19edb9bb79a0489397ff" FOREIGN KEY ("listItemId") REFERENCES "list_item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "time_log" ADD CONSTRAINT "FK_fcc70e3f69cd416396cca582e99" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "list_item_comment" ADD CONSTRAINT "FK_af74b175ed601d26d659b9a11b5" FOREIGN KEY ("listItemId") REFERENCES "list_item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "list_item_comment" ADD CONSTRAINT "FK_0ce1d6c9bb06b4e5aecccaccddc" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "list_item_checklist" ADD CONSTRAINT "FK_c86fe4eaea9d6e45f377a2a8b98" FOREIGN KEY ("listItemId") REFERENCES "list_item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "list_item_checklist" ADD CONSTRAINT "FK_728cbc4ff8edc0182346f9a1b20" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "list_item_attachment" ADD CONSTRAINT "FK_da9097c42894e85267ff1948d58" FOREIGN KEY ("listItemId") REFERENCES "list_item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "list_item_attachment" ADD CONSTRAINT "FK_53dd94db349474b6438326eb973" FOREIGN KEY ("uploadedById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "list_item_activity" ADD CONSTRAINT "FK_c7a5b7e1c6e483740cc4e1af05e" FOREIGN KEY ("listItemId") REFERENCES "list_item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "list_item_activity" ADD CONSTRAINT "FK_08990d5e12a45f4a83f305402f0" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "checklist_item" ADD CONSTRAINT "FK_4d343465f4e93cf57f23fa93717" FOREIGN KEY ("checklistId") REFERENCES "list_item_checklist"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "checklist_item" ADD CONSTRAINT "FK_3389cae6ff9f09ee11578e3329b" FOREIGN KEY ("completedById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "list_item_assignees" ADD CONSTRAINT "FK_add505e049183b0b3f3901181b7" FOREIGN KEY ("listItemId") REFERENCES "list_item"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "list_item_assignees" ADD CONSTRAINT "FK_0906924393d423b51b85cce758e" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "list_item_assignees" DROP CONSTRAINT "FK_0906924393d423b51b85cce758e"`);
        await queryRunner.query(`ALTER TABLE "list_item_assignees" DROP CONSTRAINT "FK_add505e049183b0b3f3901181b7"`);
        await queryRunner.query(`ALTER TABLE "checklist_item" DROP CONSTRAINT "FK_3389cae6ff9f09ee11578e3329b"`);
        await queryRunner.query(`ALTER TABLE "checklist_item" DROP CONSTRAINT "FK_4d343465f4e93cf57f23fa93717"`);
        await queryRunner.query(`ALTER TABLE "list_item_activity" DROP CONSTRAINT "FK_08990d5e12a45f4a83f305402f0"`);
        await queryRunner.query(`ALTER TABLE "list_item_activity" DROP CONSTRAINT "FK_c7a5b7e1c6e483740cc4e1af05e"`);
        await queryRunner.query(`ALTER TABLE "list_item_attachment" DROP CONSTRAINT "FK_53dd94db349474b6438326eb973"`);
        await queryRunner.query(`ALTER TABLE "list_item_attachment" DROP CONSTRAINT "FK_da9097c42894e85267ff1948d58"`);
        await queryRunner.query(`ALTER TABLE "list_item_checklist" DROP CONSTRAINT "FK_728cbc4ff8edc0182346f9a1b20"`);
        await queryRunner.query(`ALTER TABLE "list_item_checklist" DROP CONSTRAINT "FK_c86fe4eaea9d6e45f377a2a8b98"`);
        await queryRunner.query(`ALTER TABLE "list_item_comment" DROP CONSTRAINT "FK_0ce1d6c9bb06b4e5aecccaccddc"`);
        await queryRunner.query(`ALTER TABLE "list_item_comment" DROP CONSTRAINT "FK_af74b175ed601d26d659b9a11b5"`);
        await queryRunner.query(`ALTER TABLE "time_log" DROP CONSTRAINT "FK_fcc70e3f69cd416396cca582e99"`);
        await queryRunner.query(`ALTER TABLE "time_log" DROP CONSTRAINT "FK_30748ff19edb9bb79a0489397ff"`);
        await queryRunner.query(`ALTER TABLE "list_item" DROP CONSTRAINT "FK_986ced3779f3ea553215e347503"`);
        await queryRunner.query(`ALTER TABLE "list_item" DROP CONSTRAINT "FK_89a46892e58c831d817b2dca8f7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0906924393d423b51b85cce758"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_add505e049183b0b3f3901181b"`);
        await queryRunner.query(`DROP TABLE "list_item_assignees"`);
        await queryRunner.query(`DROP TABLE "checklist_item"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c0964cc6b8e41ab559fd0098b3"`);
        await queryRunner.query(`DROP TABLE "list_item_activity"`);
        await queryRunner.query(`DROP TYPE "public"."list_item_activity_type_enum"`);
        await queryRunner.query(`DROP TABLE "list_item_attachment"`);
        await queryRunner.query(`DROP TABLE "list_item_checklist"`);
        await queryRunner.query(`DROP TABLE "list_item_comment"`);
        await queryRunner.query(`DROP TABLE "time_log"`);
        await queryRunner.query(`DROP TYPE "public"."time_log_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c541e74b13bca8df5eaaca1a13"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_52b325de0549bfb4242656660f"`);
        await queryRunner.query(`DROP TABLE "list_item"`);
        await queryRunner.query(`DROP TYPE "public"."list_item_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."list_item_priority_enum"`);
    }

}
