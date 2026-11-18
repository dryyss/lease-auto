'use server'

import { revalidatePath } from 'next/cache'

import { requireStaff } from '@/lib/gestion/session'

export type MediaItem = { id: number; url: string; thumb: string; alt: string; filename: string; width?: number | null; height?: number | null }
type Result<T> = ({ ok: true } & T) | { ok: false; error: string }

const toItem = (m: { id: number; url?: string | null; alt: string; filename?: string | null; width?: number | null; height?: number | null; sizes?: { thumb?: { url?: string | null } } }): MediaItem => ({
  id: m.id,
  url: m.url ?? '',
  thumb: m.sizes?.thumb?.url || m.url || '',
  alt: m.alt,
  filename: m.filename ?? '',
  width: m.width,
  height: m.height,
})

const message = (err: unknown) => {
  const t = err instanceof Error ? err.message : String(err)
  if (/forbidden|not allowed/i.test(t)) return 'Vous n’avez pas les droits pour cette action.'
  if (/mime|file type|invalid file/i.test(t)) return 'Format refusé : envoyez une image JPG, PNG, WebP ou HEIC.'
  return `Échec : ${t}`
}

/** Médiathèque : images récentes ou recherche par texte alternatif / nom de fichier. */
export async function listMedia(q = '', page = 1): Promise<Result<{ items: MediaItem[]; hasMore: boolean }>> {
  try {
    const { payload, user } = await requireStaff()
    const s = q.trim()
    const res = await payload.find({
      collection: 'media',
      where: s ? { or: [{ alt: { like: s } }, { filename: { like: s } }] } : undefined,
      sort: '-createdAt',
      limit: 40,
      page,
      depth: 0,
      user,
      overrideAccess: false,
    })
    return { ok: true, items: res.docs.map(toItem), hasMore: res.hasNextPage }
  } catch (err) {
    return { ok: false, error: message(err) }
  }
}

/** Envoi d'une image (champ « file », texte alternatif « alt »). Compresser côté navigateur avant : 5 Mo max par envoi. */
export async function uploadMedia(form: FormData): Promise<Result<{ item: MediaItem }>> {
  try {
    const { payload, user } = await requireStaff()
    const file = form.get('file')
    if (!(file instanceof File) || !file.size) return { ok: false, error: 'Choisissez une image.' }
    if (!file.type.startsWith('image/')) return { ok: false, error: 'Format refusé : envoyez une image JPG, PNG, WebP ou HEIC.' }
    const alt = String(form.get('alt') ?? '').trim().slice(0, 200) || file.name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ')
    const doc = await payload.create({
      collection: 'media',
      data: { alt },
      file: { data: Buffer.from(await file.arrayBuffer()), mimetype: file.type, name: file.name, size: file.size },
      user,
      overrideAccess: false,
    })
    revalidatePath('/gestion/medias')
    return { ok: true, item: toItem(doc) }
  } catch (err) {
    return { ok: false, error: message(err) }
  }
}

export async function updateMediaAlt(id: number, alt: string): Promise<Result<object>> {
  try {
    const { payload, user } = await requireStaff()
    const text = alt.trim().slice(0, 200)
    if (!text) return { ok: false, error: 'Le texte alternatif ne peut pas être vide.' }
    await payload.update({ collection: 'media', id, data: { alt: text }, user, overrideAccess: false })
    revalidatePath('/gestion/medias')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: message(err) }
  }
}
