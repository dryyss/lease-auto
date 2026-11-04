import 'server-only'

import config from '@payload-config'
import { getPayload, type Where } from 'payload'
import { cache } from 'react'

export const payloadClient = () => getPayload({ config })

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
