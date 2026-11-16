import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Avis clients : réseaux Instagram et TikTok, note facultative (hors Google), lien vers la publication.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TYPE "public"."enum_reviews_source" ADD VALUE IF NOT EXISTS 'instagram';
  ALTER TYPE "public"."enum_reviews_source" ADD VALUE IF NOT EXISTS 'tiktok';
  ALTER TABLE "reviews" ALTER COLUMN "rating" DROP NOT NULL;
  ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "url" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Postgres ne sait pas retirer une valeur d'enum : les avis Instagram et TikTok sont supprimés, les valeurs restent.
  await db.execute(sql`
  DELETE FROM "reviews" WHERE "source" IN ('instagram', 'tiktok');
  ALTER TABLE "reviews" DROP COLUMN IF EXISTS "url";
  UPDATE "reviews" SET "rating" = 5 WHERE "rating" IS NULL;
  ALTER TABLE "reviews" ALTER COLUMN "rating" SET NOT NULL;`)
}
