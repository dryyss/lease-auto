// Remet en ligne les fichiers créés depuis ce poste : photos (media/) et justificatifs (private/documents/)
// déjà référencés en base mais absents du stockage en base (table stored_files).
// Usage : pnpm payload run src/scripts/upload-local-media.ts
import fs from 'node:fs'
import path from 'node:path'

import { getPayload } from 'payload'

import config from '@payload-config'

const payload = await getPayload({ config })
const pool = (payload.db as unknown as { pool: { query: (s: string, p?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> } }).pool

const dirs = { media: path.resolve('media'), documents: path.resolve('private/documents') } as const
let sent = 0
let missing = 0

for (const collection of ['media', 'documents'] as const) {
  const { docs } = await payload.find({ collection, limit: 5000, depth: 0, pagination: false, overrideAccess: true })
  for (const doc of docs as unknown as { filename?: string; mimeType?: string; sizes?: Record<string, { filename?: string | null; mimeType?: string | null }> }[]) {
    const files = [
      { filename: doc.filename, mimeType: doc.mimeType },
      ...Object.values(doc.sizes ?? {}).map((s) => ({ filename: s.filename ?? undefined, mimeType: s.mimeType ?? undefined })),
    ].filter((f): f is { filename: string; mimeType: string | undefined } => Boolean(f.filename))
    for (const f of files) {
      const { rows } = await pool.query(`SELECT 1 FROM "stored_files" WHERE "collection" = $1 AND "filename" = $2`, [collection, f.filename])
      if (rows.length) continue
      const local = path.join(dirs[collection], f.filename)
      if (!fs.existsSync(local)) {
        missing++
        console.log(`absent sur ce poste : ${collection}/${f.filename}`)
        continue
      }
      const data = fs.readFileSync(local)
      await pool.query(
        `INSERT INTO "stored_files" ("collection", "filename", "mime_type", "size", "data") VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
        [collection, f.filename, f.mimeType ?? 'application/octet-stream', data.length, data],
      )
      sent++
    }
  }
}
console.log(`${sent} fichier(s) mis en ligne, ${missing} introuvable(s) sur ce poste.`)
process.exit(0)
