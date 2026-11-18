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
  );`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "stored_files";`)
}
