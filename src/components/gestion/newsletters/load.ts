import 'server-only'

import type { Payload } from 'payload'

import type { Staff } from '@/lib/gestion/session'
import { mediaSrc } from '@/lib/media'

export type VehicleOption = {
  id: number
  title: string
  reference: string | null
  price: number | null
  year: number | null
  thumb: string | null
  online: boolean
}

/** Nombre d'abonnés qui recevront la newsletter (même condition que l'envoi : newsletter cochée). */
export const countRecipients = (payload: Payload, user: Staff) =>
  payload
    .count({
      collection: 'subscribers',
      where: { newsletter: { equals: true } },
      user,
      overrideAccess: false,
    })
    .then((r) => r.totalDocs)

/** Véhicules proposables : en ligne et non vendus, plus ceux déjà choisis (même vendus depuis). */
export async function loadVehicleOptions(
  payload: Payload,
  user: Staff,
  selected: number[] = [],
): Promise<VehicleOption[]> {
  const ctx = { user, overrideAccess: false as const, depth: 0, pagination: false as const }
  const select = {
    title: true,
    reference: true,
    price: true,
    year: true,
    gallery: true,
    status: true,
    _status: true,
  } as const
  const [online, chosen] = await Promise.all([
    payload.find({
      collection: 'vehicles',
      where: { and: [{ _status: { equals: 'published' } }, { status: { not_equals: 'sold' } }] },
      sort: '-createdAt',
      select,
      ...ctx,
    }),
    selected.length
      ? payload.find({ collection: 'vehicles', where: { id: { in: selected } }, select, ...ctx })
      : Promise.resolve({ docs: [] }),
  ])
  const all = [
    ...online.docs,
    ...chosen.docs.filter((c) => !online.docs.some((o) => o.id === c.id)),
  ]
  const photoIds = all.map((v) => v.gallery?.[0]).filter((g): g is number => typeof g === 'number')
  const photos = photoIds.length
    ? (
        await payload.find({
          collection: 'media',
          where: { id: { in: photoIds } },
          limit: photoIds.length,
          depth: 0,
          user,
          overrideAccess: false,
        })
      ).docs
    : []
  return all.map((v) => ({
    id: v.id,
    title: v.title || 'Sans titre',
    reference: v.reference ?? null,
    price: v.price ?? null,
    year: v.year ?? null,
    thumb:
      mediaSrc(
        photos.find((p) => p.id === v.gallery?.[0]),
        'thumb',
      ) ?? null,
    online: v._status === 'published' && v.status !== 'sold',
  }))
}
