import type { Media } from '@/payload-types'

type Size = keyof NonNullable<Media['sizes']>

/**
 * URL relative d'une image Payload. Payload préfixe ses URL avec serverURL :
 * en relatif, l'image marche sur tous les domaines (local, préprod Vercel, production).
 */
export function mediaSrc(media: unknown, size?: Size): string | undefined {
  if (!media || typeof media !== 'object') return undefined
  const m = media as Media
  const url = (size && m.sizes?.[size]?.url) || m.url
  return url?.replace(/^https?:\/\/[^/]+/, '') || undefined
}
