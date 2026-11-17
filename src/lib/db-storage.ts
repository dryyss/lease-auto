import fs from 'node:fs/promises'

import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import type { Adapter } from '@payloadcms/plugin-cloud-storage/types'
import type { Config, Payload } from 'payload'

// Fichiers (photos, justificatifs) rangés dans la base Postgres elle-même, table « stored_files ».
// Sert quand aucun stockage externe n'est branché : le disque de Vercel n'est pas conservé.
// La route /api/<collection>/file/<nom> de Payload contrôle l'accès avant d'appeler staticHandler :
// les justificatifs restent réservés à l'équipe.

type Pool = { query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> }
const pool = (payload: Payload) => (payload.db as unknown as { pool: Pool }).pool

const PUBLIC_COLLECTIONS = new Set(['media'])

export const dbStorageAdapter: Adapter = ({ collection }) => ({
  name: 'database',

  handleUpload: async ({ file, req }) => {
    const data = file.buffer?.length ? file.buffer : file.tempFilePath ? await fs.readFile(file.tempFilePath) : Buffer.alloc(0)
    await pool(req.payload).query(
      `INSERT INTO "stored_files" ("collection", "filename", "mime_type", "size", "data")
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT ("collection", "filename") DO UPDATE SET "mime_type" = EXCLUDED."mime_type", "size" = EXCLUDED."size", "data" = EXCLUDED."data", "created_at" = now()`,
      [collection.slug, file.filename, file.mimeType, data.length, data],
    )
  },

  handleDelete: async ({ filename, req }) => {
    await pool(req.payload).query(`DELETE FROM "stored_files" WHERE "collection" = $1 AND "filename" = $2`, [collection.slug, filename])
  },

  generateURL: ({ filename }) => `/api/${collection.slug}/file/${encodeURIComponent(filename)}`,

  staticHandler: async (req, { params }) => {
    const { rows } = await pool(req.payload).query(
      `SELECT "mime_type", "size", "data" FROM "stored_files" WHERE "collection" = $1 AND "filename" = $2`,
      [collection.slug, params.filename],
    )
    const row = rows[0]
    if (!row) return new Response('Fichier introuvable', { status: 404 })
    const body = row.data as Buffer
    return new Response(new Uint8Array(body), {
      headers: {
        'Content-Type': String(row.mime_type || 'application/octet-stream'),
        'Content-Length': String(body.length),
        // Photos : cache long (un nouveau fichier reçoit un nouveau nom). Justificatifs : jamais en cache partagé.
        'Cache-Control': PUBLIC_COLLECTIONS.has(collection.slug) ? 'public, max-age=31536000, immutable' : 'private, no-store',
      },
    })
  },
})

/** Branche le stockage en base sur les collections données (désactive le disque local, inutile sur Vercel). */
export const databaseStorage =
  ({ enabled, collections }: { enabled: boolean; collections: string[] }) =>
  (config: Config): Config => {
    if (!enabled) return config
    const withoutDisk: Config = {
      ...config,
      collections: (config.collections ?? []).map((c) =>
        collections.includes(c.slug) ? { ...c, upload: { ...(typeof c.upload === 'object' ? c.upload : {}), disableLocalStorage: true } } : c,
      ),
    }
    return cloudStoragePlugin({
      collections: Object.fromEntries(collections.map((slug) => [slug, { adapter: dbStorageAdapter }])),
    })(withoutDisk)
  }
