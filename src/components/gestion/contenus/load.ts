import 'server-only'

import type { MediaItem } from '@/lib/gestion/media-actions'
import type { Media } from '@/payload-types'

// Conversions côté serveur pour préremplir les formulaires « Contenus ».

/** Image Payload (chargée avec depth ≥ 1) → valeur attendue par ImagePicker. */
export function toMediaItem(m: unknown): MediaItem | null {
  if (!m || typeof m !== 'object') return null
  const x = m as Media
  return { id: x.id, url: x.url ?? '', thumb: x.sizes?.thumb?.url || x.url || '', alt: x.alt, filename: x.filename ?? '', width: x.width, height: x.height }
}

/** Date enregistrée → « AAAA-MM-JJ » (jour à Paris) pour un champ date. */
export const dayInput = (s: string | null | undefined) => (s ? new Date(s).toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' }) : '')

export const seoInitial = (meta: { title?: string | null; description?: string | null; image?: unknown } | null | undefined) => ({
  title: meta?.title ?? '',
  description: meta?.description ?? '',
  image: toMediaItem(meta?.image),
})
