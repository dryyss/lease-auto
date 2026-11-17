import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Fichiers rangés dans la base (src/lib/db-storage.ts) tant qu'aucun stockage externe n'est branché.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE IF NOT EXISTS "stored_files" (
    "collection" varchar NOT NULL,
    "filename" varchar NOT NULL,
    "mime_type" varchar,
    "size" integer,
    "data" bytea NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY ("collection", "filename")
  );
  -- Champ caché ajouté par l'extension de stockage de Payload sur les collections de fichiers.
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "_objectkey" varchar;
  ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "_objectkey" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "documents" DROP COLUMN IF EXISTS "_objectkey";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "_objectkey";
  DROP TABLE IF EXISTS "stored_files";`)
}
