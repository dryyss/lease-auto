import 'server-only'

import config from '@payload-config'
import { connection } from 'next/server'
import { getPayload, type Where } from 'payload'
import { cache } from 'react'

// Payload sans clé, ou base injoignable : pendant le pré-rendu du build, on bascule
// la page en rendu à la demande au lieu de faire échouer `next build`.
const offline = (err: unknown) => {
  const bag = err as { payloadInitError?: boolean; message?: string; cause?: { payloadInitError?: boolean; message?: string } }
  const msg = `${bag?.message ?? ''} ${bag?.cause?.message ?? ''}`
  return Boolean(bag?.payloadInitError || bag?.cause?.payloadInitError) || /secret key|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|password authentication/i.test(msg)
}

export const payloadClient = () =>
  getPayload({ config }).catch(async (err: unknown) => {
    if (offline(err)) await connection()
    throw err
  })

/** Réglages lus une seule fois par requête, même si plusieurs composants les demandent. */
export const getSettings = cache(async () => (await payloadClient()).findGlobal({ slug: 'settings', depth: 0 }))

export const getHomepage = cache(async () => (await payloadClient()).findGlobal({ slug: 'homepage', depth: 1 }))

/** Véhicules visibles au public : publiés, et vendus seulement pendant le délai défini (PUB-07). */
export const visibleVehiclesWhere = async (): Promise<{ and: Where[] }> => {
  const settings = await getSettings()
  const days = settings.retention?.soldVisibleDays ?? 15
  const soldSince = new Date(Date.now() - days * 86_400_000).toISOString()
  return {
    and: [
      { _status: { equals: 'published' } },
      { or: [{ status: { not_equals: 'sold' } }, { soldAt: { greater_than: soldSince } }] },
    ],
  }
}
