import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Champ caché ajouté par l'extension de stockage de Payload sur les collections de fichiers.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "_objectkey" varchar;
  ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "_objectkey" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "documents" DROP COLUMN IF EXISTS "_objectkey";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "_objectkey";`)
}
