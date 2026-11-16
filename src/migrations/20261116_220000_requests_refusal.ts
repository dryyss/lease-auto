import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Demandes : motif de refus (obligatoire au passage en « Refus ») et précision libre.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    CREATE TYPE "public"."enum_requests_refusal_reason" AS ENUM('income', 'debt', 'banking', 'seniority', 'documents', 'lender', 'withdrawn', 'unreachable', 'other');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  ALTER TABLE "requests" ADD COLUMN IF NOT EXISTS "refusal_reason" "enum_requests_refusal_reason";
  ALTER TABLE "requests" ADD COLUMN IF NOT EXISTS "refusal_note" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "requests" DROP COLUMN IF EXISTS "refusal_note";
  ALTER TABLE "requests" DROP COLUMN IF EXISTS "refusal_reason";
  DROP TYPE IF EXISTS "public"."enum_requests_refusal_reason";`)
}
