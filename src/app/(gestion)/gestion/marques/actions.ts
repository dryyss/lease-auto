'use server'

import { revalidatePath } from 'next/cache'
import type { Payload } from 'payload'

import { errorMessage, fail, type Result } from '@/components/gestion/rendez-vous/result'
import { slugify } from '@/fields/slug'
import { isAdminUser, requireStaff, type Staff } from '@/lib/gestion/session'
import type { MediaItem } from '@/lib/gestion/media-actions'
import { markdownToRichText, richTextToMarkdown } from '@/lib/gestion/richtext'
import { mediaSrc } from '@/lib/media'
import type { Brand, Media } from '@/payload-types'

export type Kind = 'brand' | 'model'

/** Fiche éditée dans la fenêtre « Modifier » (marque ou modèle). */
export type CatalogEntry = {
  kind: Kind
  id: number
  name: string
  slug: string
  brandSlug: string | null
  logo: MediaItem | null
  intro: string
  seo: { title: string; description: string; image: MediaItem | null }
}

export type CatalogSave = {
  kind: Kind
  id: number
  name: string
  /** Mettre l'adresse de la page à jour d'après le nouveau nom. */
  renameSlug: boolean
  logo: number | null
  /** null = texte de présentation inchangé (on ne réécrit pas une mise en forme qu'on n'a pas touchée). */
  intro: string | null
  seo: { title: string; description: string; image: number | null }
}

const ctx = (user: Staff) => ({ user, overrideAccess: false as const, depth: 0 })
const cleanName = (s: string) => s.replace(/\s+/g, ' ').trim().slice(0, 80)

function refresh() {
  revalidatePath('/gestion/marques')
  revalidatePath('/gestion/vehicules', 'layout')
  revalidatePath('/vehicules', 'layout')
}

const toItem = (m: unknown): MediaItem | null => {
  if (!m || typeof m !== 'object') return null
  const x = m as Media
  return {
    id: x.id,
    url: mediaSrc(x) ?? '',
    thumb: mediaSrc(x, 'thumb') ?? '',
    alt: x.alt,
    filename: x.filename ?? '',
    width: x.width,
    height: x.height,
  }
}

/** Véhicules rattachés (dernière version brouillon comprise, et version en ligne). */
async function vehicleCount(payload: Payload, user: Staff, field: 'brand' | 'model', id: number) {
  const where = { [field]: { equals: id } }
  const [live, draft] = await Promise.all([
    payload.count({ collection: 'vehicles', where, user, overrideAccess: false }),
    payload.find({
      collection: 'vehicles',
      where,
      draft: true,
      limit: 1,
      select: { title: true },
      ...ctx(user),
    }),
  ])
  return Math.max(live.totalDocs, draft.totalDocs)
}

const sameName = (a: string, b: string) => a.localeCompare(b, 'fr', { sensitivity: 'base' }) === 0

export async function addBrand(name: string): Promise<Result> {
  const { payload, user } = await requireStaff()
  const n = cleanName(name)
  if (!n) return fail('Indiquez le nom de la marque.')
  try {
    const { docs } = await payload.find({
      collection: 'brands',
      where: { or: [{ name: { like: n } }, { slug: { equals: slugify(n) } }] },
      limit: 20,
      ...ctx(user),
    })
    if (docs.some((b) => sameName(b.name, n) || b.slug === slugify(n)))
      return fail(`La marque « ${n} » existe déjà.`)
    await payload.create({
      collection: 'brands',
      data: { name: n, slug: slugify(n) },
      ...ctx(user),
    })
  } catch (err) {
    return fail(errorMessage(err))
  }
  refresh()
  return { ok: true }
}

export async function addModel(brandId: number, name: string): Promise<Result> {
  const { payload, user } = await requireStaff()
  const n = cleanName(name)
  if (!n) return fail('Indiquez le nom du modèle.')
  const brand = await payload
    .findByID({ collection: 'brands', id: brandId, ...ctx(user) })
    .catch(() => null)
  if (!brand) return fail('Cette marque n’existe plus. Rechargez la page.')
  try {
    const { docs } = await payload.find({
      collection: 'models',
      where: { brand: { equals: brandId } },
      pagination: false,
      ...ctx(user),
    })
    if (docs.some((m) => sameName(m.name, n) || m.slug === slugify(n)))
      return fail(`Le modèle « ${n} » existe déjà chez ${brand.name}.`)
    await payload.create({
      collection: 'models',
      data: { name: n, slug: slugify(n), brand: brandId },
      ...ctx(user),
    })
  } catch (err) {
    return fail(errorMessage(err))
  }
  refresh()
  return { ok: true }
}

/** Charge une marque ou un modèle pour la fenêtre d'édition (texte riche converti en Markdown). */
export async function loadEntry(
  kind: Kind,
  id: number,
): Promise<{ ok: true; entry: CatalogEntry } | { ok: false; error: string }> {
  const { payload, user } = await requireStaff()
  try {
    const doc =
      kind === 'brand'
        ? await payload.findByID({
            collection: 'brands',
            id,
            depth: 1,
            user,
            overrideAccess: false,
          })
        : await payload.findByID({
            collection: 'models',
            id,
            depth: 1,
            user,
            overrideAccess: false,
          })
    const brandSlug =
      kind === 'model' && 'brand' in doc && typeof doc.brand === 'object'
        ? (doc.brand.slug ?? null)
        : null
    return {
      ok: true,
      entry: {
        kind,
        id,
        name: doc.name,
        slug: doc.slug ?? '',
        brandSlug,
        logo: 'logo' in doc ? toItem(doc.logo) : null,
        intro: await richTextToMarkdown(doc.intro),
        seo: {
          title: doc.meta?.title ?? '',
          description: doc.meta?.description ?? '',
          image: toItem(doc.meta?.image),
        },
      },
    }
  } catch (err) {
    return { ok: false, error: errorMessage(err) }
  }
}

export async function saveEntry(input: CatalogSave): Promise<Result> {
  const { payload, user } = await requireStaff()
  const name = cleanName(input.name)
  if (!name) return fail('Le nom ne peut pas être vide.')
  const slug = slugify(name)
  if (!slug) return fail('Le nom doit contenir au moins une lettre ou un chiffre.')
  const seo = {
    title: input.seo.title.trim().slice(0, 120),
    description: input.seo.description.trim().slice(0, 320),
    image: input.seo.image,
  }
  const intro =
    input.intro === null ? undefined : ((await markdownToRichText(input.intro)) as Brand['intro'])

  try {
    if (input.kind === 'brand') {
      const current = await payload
        .findByID({ collection: 'brands', id: input.id, ...ctx(user) })
        .catch(() => null)
      if (!current) return fail('Cette marque n’existe plus. Rechargez la page.')
      const { docs } = await payload.find({
        collection: 'brands',
        where: { id: { not_equals: input.id } },
        pagination: false,
        select: { name: true, slug: true },
        ...ctx(user),
      })
      if (docs.some((b) => sameName(b.name, name)))
        return fail(`Une autre marque s’appelle déjà « ${name} ».`)
      if (input.renameSlug && docs.some((b) => b.slug === slug))
        return fail(`L’adresse /vehicules/${slug} est déjà prise par une autre marque.`)
      await payload.update({
        collection: 'brands',
        id: input.id,
        data: {
          name,
          slug: input.renameSlug ? slug : current.slug,
          logo: input.logo,
          meta: seo,
          ...(intro !== undefined && { intro }),
        },
        ...ctx(user),
      })
    } else {
      const current = await payload
        .findByID({ collection: 'models', id: input.id, ...ctx(user) })
        .catch(() => null)
      if (!current) return fail('Ce modèle n’existe plus. Rechargez la page.')
      const brandId = typeof current.brand === 'object' ? current.brand.id : current.brand
      const { docs } = await payload.find({
        collection: 'models',
        where: { and: [{ brand: { equals: brandId } }, { id: { not_equals: input.id } }] },
        pagination: false,
        select: { name: true, slug: true },
        ...ctx(user),
      })
      if (docs.some((m) => sameName(m.name, name)))
        return fail(`Un autre modèle de cette marque s’appelle déjà « ${name} ».`)
      if (input.renameSlug && docs.some((m) => m.slug === slug))
        return fail(`L’adresse « ${slug} » est déjà prise par un autre modèle de cette marque.`)
      await payload.update({
        collection: 'models',
        id: input.id,
        data: {
          name,
          slug: input.renameSlug ? slug : current.slug,
          meta: seo,
          ...(intro !== undefined && { intro }),
        },
        ...ctx(user),
      })
    }
  } catch (err) {
    return fail(errorMessage(err))
  }
  refresh()
  return { ok: true }
}

/** Suppression d'un modèle (administrateur), refusée s'il a des véhicules. */
export async function deleteModel(id: number): Promise<Result> {
  const { payload, user } = await requireStaff()
  if (!isAdminUser(user)) return fail('Seul un administrateur peut supprimer un modèle.')
  const model = await payload.findByID({ collection: 'models', id, ...ctx(user) }).catch(() => null)
  if (!model) return fail('Ce modèle est déjà supprimé.')
  try {
    const n = await vehicleCount(payload, user, 'model', id)
    if (n)
      return fail(
        `Impossible : ${n > 1 ? `${n} véhicules utilisent` : 'un véhicule utilise'} ce modèle. Changez-les de modèle ou supprimez-les d’abord.`,
      )
    await payload.delete({ collection: 'models', id, ...ctx(user) })
  } catch (err) {
    return fail(errorMessage(err))
  }
  refresh()
  return { ok: true }
}

/** Suppression d'une marque et de ses modèles (administrateur), refusée s'il reste des véhicules. */
export async function deleteBrand(id: number): Promise<Result> {
  const { payload, user } = await requireStaff()
  if (!isAdminUser(user)) return fail('Seul un administrateur peut supprimer une marque.')
  const brand = await payload.findByID({ collection: 'brands', id, ...ctx(user) }).catch(() => null)
  if (!brand) return fail('Cette marque est déjà supprimée.')
  try {
    const n = await vehicleCount(payload, user, 'brand', id)
    if (n)
      return fail(
        `Impossible : ${n > 1 ? `${n} véhicules sont` : 'un véhicule est'} de cette marque. Supprimez-les ou changez-les de marque d’abord.`,
      )
    await payload.delete({ collection: 'models', where: { brand: { equals: id } }, ...ctx(user) })
    await payload.delete({ collection: 'brands', id, ...ctx(user) })
  } catch (err) {
    return fail(errorMessage(err))
  }
  refresh()
  return { ok: true }
}
