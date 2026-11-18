'use server'

import { revalidatePath } from 'next/cache'
import type { Payload } from 'payload'

import {
  FIELD_LABELS,
  formatPlate,
  textToLexical,
  validateVehicle,
  type Fail,
  type FieldErrors,
  type ModelOption,
  type Option,
  type Result,
  type VehicleInput,
} from '@/components/gestion/vehicules/shared'
import { slugify } from '@/fields/slug'
import { isAdminUser, requireStaff, type Staff } from '@/lib/gestion/session'
import { mediaSrc } from '@/lib/media'
import type { Vehicle } from '@/payload-types'

// Collection versionnée (brouillons) :
// - publier = update/create avec `draft: false` et `_status: 'published'` (validation complète, ligne principale mise à jour) ;
// - brouillon jamais publié = `draft: true` (pas de validation, seule une nouvelle version est écrite : on envoie le document entier) ;
// - repasser en brouillon une annonce en ligne = `_status: 'draft'` avec `draft: false` (retire l'annonce du site).

const MAX_PHOTO = 4.5 * 1024 * 1024

/* Erreurs Payload → messages en français. */
const MESSAGES: [RegExp, string][] = [
  [/required/i, 'Ce champ est obligatoire.'],
  [/unique/i, 'Cette valeur est déjà utilisée par une autre fiche.'],
  [/greater than or equal|less than|minimum|maximum/i, 'Valeur hors limites.'],
  [/not a valid|invalid/i, 'Valeur non valable.'],
]
const fr = (message: string) => MESSAGES.find(([re]) => re.test(message))?.[1] ?? message

function fail(err: unknown, payload?: Payload): Fail {
  const e = err as { name?: string; message?: string; status?: number; data?: { errors?: { path?: string; message?: string }[] } }
  const list = e?.data?.errors
  if (Array.isArray(list) && list.length) {
    const fields: FieldErrors = {}
    for (const item of list) {
      const key = String(item.path ?? '').split('.')[0] || 'form'
      fields[key] ??= fr(String(item.message ?? ''))
    }
    const names = Object.keys(fields).map((k) => FIELD_LABELS[k] ?? k)
    return { ok: false, error: `À corriger : ${names.join(', ')}.`, fields }
  }
  if (e?.status === 403 || e?.name === 'Forbidden') return { ok: false, error: 'Vous n’avez pas le droit de faire cette action.' }
  if (e?.status === 404 || e?.name === 'NotFound') return { ok: false, error: 'Cette fiche n’existe plus. Rechargez la liste.' }
  payload?.logger.error({ err }, 'Gestion véhicules : erreur')
  return { ok: false, error: 'L’enregistrement a échoué. Réessayez ; si cela continue, prévenez l’administrateur.' }
}

function refresh(slug?: string | null) {
  revalidatePath('/gestion/vehicules', 'layout')
  revalidatePath('/gestion')
  revalidatePath('/vehicules', 'layout')
  revalidatePath('/')
  if (slug) revalidatePath(`/vehicule/${slug}`)
}

/** Adresse unique pour une nouvelle annonce (titre + référence), suffixée -2, -3… si déjà prise. */
async function uniqueSlug(payload: Payload, user: Staff, source: string, exceptId?: number) {
  const base = slugify(source) || 'vehicule'
  for (let i = 1; i < 50; i++) {
    const slug = i === 1 ? base : `${base}-${i}`
    const { totalDocs } = await payload.count({
      collection: 'vehicles',
      where: { and: [{ slug: { equals: slug } }, ...(exceptId ? [{ id: { not_equals: exceptId } }] : [])] },
      user,
      overrideAccess: false,
    })
    if (!totalDocs) return slug
  }
  return `${base}-${Date.now()}`
}

/** Dernière version (brouillon compris) et état de la ligne publique. */
async function load(payload: Payload, user: Staff, id: number) {
  const latest = await payload.findByID({ collection: 'vehicles', id, draft: true, depth: 0, user, overrideAccess: false })
  const main = await payload.findByID({ collection: 'vehicles', id, draft: false, depth: 0, select: { _status: true }, user, overrideAccess: false })
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = latest
  return { latest, rest, online: main._status === 'published' }
}

/** Les textes alternatifs générés (« …, photo n ») suivent le titre et l'ordre des photos. */
async function syncAlts(payload: Payload, user: Staff, title: string, gallery: number[]) {
  if (!gallery.length) return
  try {
    const { docs } = await payload.find({ collection: 'media', where: { id: { in: gallery } }, depth: 0, limit: gallery.length, select: { alt: true }, user, overrideAccess: false })
    for (const m of docs) {
      const wanted = `${title}, photo ${gallery.indexOf(m.id) + 1}`
      if (m.alt !== wanted && /, photo \d+$/.test(m.alt ?? '')) {
        await payload.update({ collection: 'media', id: m.id, data: { alt: wanted }, depth: 0, user, overrideAccess: false })
      }
    }
  } catch (err) {
    payload.logger.warn({ err }, 'Textes alternatifs non mis à jour')
  }
}

/** Crée ou met à jour un véhicule. `publish` = état voulu (en ligne ou brouillon). */
export async function saveVehicle(input: VehicleInput): Promise<Result<{ id: number; slug: string | null; published: boolean }>> {
  const { payload, user } = await requireStaff()

  // Titre vide : « Marque Modèle ».
  let title = input.title.trim()
  if (!title && input.brand && input.model) {
    const [b, m] = await Promise.all([
      payload.findByID({ collection: 'brands', id: input.brand, depth: 0, user, overrideAccess: false }).catch(() => null),
      payload.findByID({ collection: 'models', id: input.model, depth: 0, user, overrideAccess: false }).catch(() => null),
    ])
    title = [b?.name, m?.name].filter(Boolean).join(' ')
  }
  const v = { ...input, title }
  const errors = validateVehicle(v)
  if (Object.keys(errors).length) {
    return { ok: false, error: `À corriger : ${Object.keys(errors).map((k) => FIELD_LABELS[k] ?? k).join(', ')}.`, fields: errors }
  }

  const data: Record<string, unknown> = {
    brand: v.brand,
    model: v.model,
    title,
    reference: v.reference.trim() || null,
    plate: v.plate.trim() ? formatPlate(v.plate) : null,
    featured: v.featured,
    status: v.status,
    gallery: v.gallery,
    year: v.year,
    firstRegistration: v.firstRegistration ? `${v.firstRegistration}T12:00:00.000Z` : null,
    mileage: v.mileage,
    fuel: v.fuel || null,
    gearbox: v.gearbox || null,
    bodyType: v.bodyType || null,
    powerHp: v.powerHp,
    fiscalHp: v.fiscalHp,
    doors: v.doors,
    seats: v.seats,
    color: v.color.trim() || null,
    co2: v.co2,
    critAir: v.critAir || null,
    warrantyMonths: v.warrantyMonths,
    price: v.price,
    // Seules les saisies manuelles sont envoyées : le reste est recalculé par la collection (taux des Réglages).
    monthlies: v.monthlies.filter((m) => m.manual).map(({ formula, amount, months, deposit }) => ({ formula, manual: true, amount, months, deposit })),
    equipment: v.equipment.map((label) => label.trim()).filter(Boolean).map((label) => ({ label })),
    ...(v.description !== null ? { description: textToLexical(v.description) } : {}),
  }
  const ctx = { user, overrideAccess: false as const, depth: 0 }

  try {
    let doc: Vehicle
    if (!v.id) {
      data.slug = await uniqueSlug(payload, user, [title, v.reference].filter(Boolean).join(' '))
      doc = await payload.create({ collection: 'vehicles', data: { ...data, _status: v.publish ? 'published' : 'draft' } as never, draft: !v.publish, ...ctx })
    } else {
      const { latest, rest, online } = await load(payload, user, v.id)
      // L'adresse publique ne change pas quand on retouche le titre.
      data.slug = latest.slug || (await uniqueSlug(payload, user, [title, v.reference].filter(Boolean).join(' '), v.id))
      const full = { ...rest, ...data }
      if (v.publish) {
        doc = await payload.update({ collection: 'vehicles', id: v.id, data: { ...full, _status: 'published' } as never, draft: false, ...ctx })
      } else {
        if (online) {
          // Retire d'abord l'annonce du site, puis enregistre le brouillon (qui peut être incomplet).
          await payload.update({ collection: 'vehicles', id: v.id, data: { _status: 'draft', status: latest.status }, draft: false, ...ctx })
        }
        doc = await payload.update({ collection: 'vehicles', id: v.id, data: { ...full, _status: 'draft' } as never, draft: true, ...ctx })
      }
    }
    await syncAlts(payload, user, title, v.gallery)
    refresh(doc.slug)
    return { ok: true, id: doc.id, slug: doc.slug ?? null, published: v.publish }
  } catch (err) {
    return fail(err, payload)
  }
}

/** Disponibilité seule (Disponible / Réservé / Vendu), sans toucher au reste de la fiche. */
export async function setStatus(id: number, status: Vehicle['status']): Promise<Result> {
  const { payload, user } = await requireStaff()
  if (!['available', 'reserved', 'sold'].includes(status)) return { ok: false, error: 'Disponibilité inconnue.' }
  try {
    const { latest, rest, online } = await load(payload, user, id)
    const ctx = { user, overrideAccess: false as const, depth: 0 }
    if (online) await payload.update({ collection: 'vehicles', id, data: { status }, draft: false, ...ctx })
    else await payload.update({ collection: 'vehicles', id, data: { ...rest, status, _status: 'draft' } as never, draft: true, ...ctx })
    refresh(latest.slug)
    return { ok: true }
  } catch (err) {
    return fail(err, payload)
  }
}

/** Met en ligne (fiche complète exigée) ou retire du site la dernière version enregistrée. */
export async function setPublished(id: number, published: boolean): Promise<Result> {
  const { payload, user } = await requireStaff()
  try {
    const { latest, rest } = await load(payload, user, id)
    const ctx = { user, overrideAccess: false as const, depth: 0 }
    if (published) await payload.update({ collection: 'vehicles', id, data: { ...rest, _status: 'published' } as never, draft: false, ...ctx })
    else await payload.update({ collection: 'vehicles', id, data: { _status: 'draft', status: latest.status }, draft: false, ...ctx })
    refresh(latest.slug)
    return { ok: true }
  } catch (err) {
    return fail(err, payload)
  }
}

/** Suppression définitive : administrateur uniquement. Les photos restent dans la médiathèque. */
export async function deleteVehicle(id: number): Promise<Result> {
  const { payload, user } = await requireStaff()
  if (!isAdminUser(user)) return { ok: false, error: 'Seul un administrateur peut supprimer un véhicule.' }
  try {
    const doc = await payload.delete({ collection: 'vehicles', id, depth: 0, user, overrideAccess: false })
    refresh(doc.slug)
    return { ok: true }
  } catch (err) {
    return fail(err, payload)
  }
}

/** Envoi d'une photo (déjà compressée par le navigateur). Crée l'image dans la médiathèque. */
export async function uploadPhoto(form: FormData): Promise<Result<{ id: number; url: string | null; alt: string }>> {
  const { payload, user } = await requireStaff()
  const file = form.get('file')
  if (!(file instanceof File) || !file.size) return { ok: false, error: 'Aucun fichier reçu.' }
  if (!file.type.startsWith('image/')) return { ok: false, error: `« ${file.name} » n’est pas une image.` }
  if (file.size > MAX_PHOTO) return { ok: false, error: `« ${file.name} » est trop lourde (4,5 Mo au maximum).` }
  const alt = String(form.get('alt') ?? '').trim().slice(0, 200) || 'Photo du véhicule, photo 1'
  try {
    const media = await payload.create({
      collection: 'media',
      data: { alt },
      file: { data: Buffer.from(await file.arrayBuffer()), mimetype: file.type, name: file.name, size: file.size },
      depth: 0,
      user,
      overrideAccess: false,
    })
    return { ok: true, id: media.id, url: mediaSrc(media, 'thumb') ?? null, alt: media.alt }
  } catch (err) {
    payload.logger.error({ err }, 'Photo véhicule non enregistrée')
    if (/heic|heif|unsupported image|input buffer/i.test(String((err as Error)?.message))) {
      return { ok: false, error: `« ${file.name} » : format non pris en charge. Envoyez-la en JPEG ou PNG.` }
    }
    return { ok: false, error: `« ${file.name} » n’a pas pu être enregistrée. Réessayez.` }
  }
}

const cleanName = (name: string) => name.replace(/\s+/g, ' ').trim().slice(0, 80)

/** Nouvelle marque (ou celle qui existe déjà sous ce nom). */
export async function createBrand(name: string): Promise<Result<{ brand: Option }>> {
  const { payload, user } = await requireStaff()
  const n = cleanName(name)
  if (!n) return { ok: false, error: 'Indiquez le nom de la marque.' }
  try {
    const { docs } = await payload.find({ collection: 'brands', where: { name: { like: n } }, depth: 0, limit: 20, user, overrideAccess: false })
    const same = docs.find((b) => b.name.toLowerCase() === n.toLowerCase())
    if (same) return { ok: true, brand: { id: same.id, name: same.name } }
    const b = await payload.create({ collection: 'brands', data: { name: n }, depth: 0, user, overrideAccess: false })
    revalidatePath('/vehicules', 'layout')
    return { ok: true, brand: { id: b.id, name: b.name } }
  } catch (err) {
    return fail(err, payload)
  }
}

/** Nouveau modèle pour une marque (ou celui qui existe déjà). */
export async function createModel(brandId: number, name: string): Promise<Result<{ model: ModelOption }>> {
  const { payload, user } = await requireStaff()
  const n = cleanName(name)
  if (!brandId) return { ok: false, error: 'Choisissez d’abord la marque.' }
  if (!n) return { ok: false, error: 'Indiquez le nom du modèle.' }
  try {
    const { docs } = await payload.find({ collection: 'models', where: { brand: { equals: brandId } }, depth: 0, pagination: false, user, overrideAccess: false })
    const same = docs.find((m) => m.name.toLowerCase() === n.toLowerCase() || m.slug === slugify(n))
    if (same) return { ok: true, model: { id: same.id, name: same.name, brand: brandId } }
    const m = await payload.create({ collection: 'models', data: { name: n, brand: brandId }, depth: 0, user, overrideAccess: false })
    revalidatePath('/vehicules', 'layout')
    return { ok: true, model: { id: m.id, name: m.name, brand: brandId } }
  } catch (err) {
    return fail(err, payload)
  }
}
