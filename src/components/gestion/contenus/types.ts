// Types partagés entre les écrans « Contenus » et leurs actions serveur.
import type { Faq } from '@/payload-types'

export type FieldErrors = Record<string, string>
export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string; fields?: FieldErrors }

/** Ligne d'une liste éditable : `id` = identifiant Payload (lignes existantes), `key` = clé d'affichage. */
export type Row<T> = T & { key: string; id?: string | null }

export type HomepageInput = {
  hero: { title: string; subtitle: string; image: number | null; badges: { id?: string | null; label: string }[] }
  stats: { id?: string | null; value: string; label: string }[]
  steps: { id?: string | null; title: string; text: string }[]
  featuredFaqs: number[]
}

/** `content` à null : texte inchangé, la version enregistrée est gardée telle quelle (mise en forme comprise). */
export type AgencyInput = { title: string; intro: string; content: string | null; photos: number[]; mapEmbedUrl: string }

export type FaqCategory = Faq['category']
export type FaqInput = { id?: number; question: string; answer: string | null; category: FaqCategory; order: number | null }
export type FaqItem = { id: number; question: string; answer: string; category: FaqCategory; order: number | null; updatedAt: string }

export const FAQ_CATEGORIES: { value: FaqCategory; label: string }[] = [
  { value: 'general', label: 'Général' },
  { value: 'loa', label: 'LOA' },
  { value: 'lld', label: 'LLD' },
  { value: 'credit', label: 'Crédit' },
  { value: 'dossier', label: 'Dossier et justificatifs' },
  { value: 'livraison', label: 'Livraison et garantie' },
]
export const faqCategoryLabel = (c: string) => FAQ_CATEGORIES.find((x) => x.value === c)?.label ?? c

/** Guides (articles) et pages locales : même écran, champs propres à chacun. */
export type DocKind = 'articles' | 'local-pages'
export type DocInput = {
  id?: number
  publish: boolean
  slug: string
  content: string | null
  meta: { title: string; description: string; image: number | null }
  // Guides
  title: string
  publishedAt: string
  cover: number | null
  excerpt: string
  // Pages locales
  city: string
  headline: string
  distanceNote: string
}

export const PUBLIC_BASE: Record<DocKind, string> = { articles: '/guides/', 'local-pages': '/voiture-occasion/' }
export const CONSOLE_BASE: Record<DocKind, string> = { articles: '/gestion/contenus/articles', 'local-pages': '/gestion/contenus/pages-locales' }

/** Le site n'affiche que les cartes Google intégrées (adresse « https://www.google.com/maps/embed… »). */
export const MAP_EMBED_PREFIX = 'https://www.google.com/maps/embed'

/** Accepte l'adresse seule ou tout le code <iframe …> copié depuis Google Maps. */
export function extractMapUrl(raw: string): string {
  const s = raw.trim()
  const src = s.match(/src\s*=\s*["']([^"']+)["']/i)?.[1] ?? s
  return src.replace(/&amp;/g, '&').trim()
}
