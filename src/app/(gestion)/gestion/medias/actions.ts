'use server'

import { revalidatePath } from 'next/cache'
import type { Payload, Where } from 'payload'

import { errorMessage, fail, type Result } from '@/components/gestion/rendez-vous/result'
import { requireStaff, type Staff } from '@/lib/gestion/session'

export type MediaUsage = { vehicles: { id: number; title: string }[]; others: string[] }

const idIn = (v: unknown, id: number) =>
  (Array.isArray(v) ? v : [v]).some(
    (x) => (typeof x === 'object' && x ? (x as { id: number }).id : x) === id,
  )

/**
 * Où l'image est utilisée. Véhicules (galerie, image de partage) : dernière version et version en ligne.
 * Ailleurs (marques, modèles, articles, pages, accueil, agence) : simple avertissement.
 * Une image insérée dans un texte riche n'est pas détectée.
 */
async function usageOf(payload: Payload, user: Staff, id: number): Promise<MediaUsage> {
  const ctx = { user, overrideAccess: false as const, depth: 0, limit: 50 }
  const vehicleWhere: Where = { or: [{ gallery: { in: [id] } }, { 'meta.image': { equals: id } }] }
  const [draft, live] = await Promise.all([
    payload.find({
      collection: 'vehicles',
      where: vehicleWhere,
      draft: true,
      select: { title: true },
      ...ctx,
    }),
    payload.find({
      collection: 'vehicles',
      where: vehicleWhere,
      draft: false,
      select: { title: true },
      ...ctx,
    }),
  ])
  const vehicles = new Map<number, string>()
  for (const v of [...draft.docs, ...live.docs]) vehicles.set(v.id, v.title || 'Sans titre')

  const others: string[] = []
  const checks = await Promise.allSettled([
    payload
      .find({
        collection: 'brands',
        where: { or: [{ logo: { equals: id } }, { 'meta.image': { equals: id } }] },
        select: { name: true },
        ...ctx,
      })
      .then((r) => r.docs.map((d) => `Marque « ${d.name} »`)),
    payload
      .find({
        collection: 'models',
        where: { 'meta.image': { equals: id } },
        select: { name: true },
        ...ctx,
      })
      .then((r) => r.docs.map((d) => `Modèle « ${d.name} »`)),
    payload
      .find({
        collection: 'articles',
        where: { or: [{ cover: { equals: id } }, { 'meta.image': { equals: id } }] },
        draft: true,
        select: { title: true },
        ...ctx,
      })
      .then((r) => r.docs.map((d) => `Article « ${d.title} »`)),
    payload
      .find({
        collection: 'local-pages',
        where: { 'meta.image': { equals: id } },
        draft: true,
        select: { city: true },
        ...ctx,
      })
      .then((r) => r.docs.map((d) => `Page locale « ${d.city} »`)),
    payload
      .findGlobal({ slug: 'homepage', depth: 0, user, overrideAccess: false })
      .then((g) => (idIn(g.hero?.image, id) ? ['Page d’accueil'] : [])),
    payload
      .findGlobal({ slug: 'agency', depth: 0, user, overrideAccess: false })
      .then((g) => (idIn(g.photos ?? [], id) ? ['Page agence'] : [])),
  ])
  for (const c of checks) if (c.status === 'fulfilled') others.push(...c.value)

  return { vehicles: [...vehicles].map(([vid, title]) => ({ id: vid, title })), others }
}

export async function getMediaUsage(
  id: number,
): Promise<{ ok: true; usage: MediaUsage } | { ok: false; error: string }> {
  const { payload, user } = await requireStaff()
  try {
    return { ok: true, usage: await usageOf(payload, user, id) }
  } catch (err) {
    return fail(errorMessage(err)) as { ok: false; error: string }
  }
}

/** Suppression définitive d'une image, refusée tant qu'un véhicule l'utilise. */
export async function deleteMedia(id: number): Promise<Result> {
  const { payload, user } = await requireStaff()
  const doc = await payload
    .findByID({ collection: 'media', id, depth: 0, user, overrideAccess: false })
    .catch(() => null)
  if (!doc) return fail('Cette image est déjà supprimée.')
  try {
    const usage = await usageOf(payload, user, id)
    if (usage.vehicles.length) {
      return fail(
        `Image utilisée par ${usage.vehicles.length > 1 ? `${usage.vehicles.length} véhicules` : 'un véhicule'} : retirez-la d’abord de sa fiche.`,
      )
    }
    await payload.delete({ collection: 'media', id, depth: 0, user, overrideAccess: false })
    revalidatePath('/gestion/medias')
    if (usage.others.length) revalidatePath('/', 'layout')
    return { ok: true }
  } catch (err) {
    return fail(errorMessage(err))
  }
}
