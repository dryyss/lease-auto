import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Véhicules : immatriculation (interne, recherchable dans la liste), aussi dans l'historique des versions.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "plate" varchar;
  ALTER TABLE "_vehicles_v" ADD COLUMN IF NOT EXISTS "version_plate" varchar;
  CREATE INDEX IF NOT EXISTS "vehicles_plate_idx" ON "vehicles" USING btree ("plate");
  CREATE INDEX IF NOT EXISTS "_vehicles_v_version_version_plate_idx" ON "_vehicles_v" USING btree ("version_plate");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP INDEX IF EXISTS "_vehicles_v_version_version_plate_idx";
  DROP INDEX IF EXISTS "vehicles_plate_idx";
  ALTER TABLE "_vehicles_v" DROP COLUMN IF EXISTS "version_plate";
  ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "plate";`)
}
