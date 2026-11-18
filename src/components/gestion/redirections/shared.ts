// Redirections des anciennes adresses (collection « redirects » du plugin Payload), partagé navigateur / serveur.

export type Target = 'vehicles' | 'articles' | 'local-pages'

/** Pages du site vers lesquelles on peut rediriger, et leur préfixe d'adresse (cf. src/lib/redirects.ts). */
export const TARGETS: Record<Target, { label: string; base: string }> = {
  vehicles: { label: 'Véhicule', base: '/vehicule/' },
  articles: { label: 'Article', base: '/guides/' },
  'local-pages': { label: 'Page locale', base: '/voiture-occasion/' },
}

export type PageOption = { id: number; label: string; path: string; draft?: boolean }
export type Options = Record<Target, PageOption[]>

export type RedirectInput = {
  id?: number
  from: string
  toType: 'reference' | 'custom'
  relationTo: Target
  refId: number | null
  url: string
}

export type RedirectRow = RedirectInput & { id: number; updatedAt: string }

export type FieldErrors = Partial<Record<'from' | 'url' | 'refId', string>>
export type Result = { ok: true } | { ok: false; error: string; fields?: FieldErrors }

const RESERVED = /^\/(gestion|admin|api|_next|auth|dev)(\/|$)/i

/** Ancienne adresse : domaine retiré, « / » au début, sans « / » final, ni paramètres. */
export function normalizeFrom(raw: string): string {
  let s = raw.trim()
  const full = s.match(/^(?:https?:)?\/\/[^/]+(\/[^?#]*)?/i)
  if (full) s = full[1] || '/'
  else if (/^[\w-]+(\.[\w-]+)+\//.test(s)) s = s.slice(s.indexOf('/')) // « www.lease-auto.fr/… »
  if (s && !s.startsWith('/')) s = `/${s}`
  if (s.length > 1) s = s.replace(/\/+$/, '')
  return s
}

export function validateRedirect(v: RedirectInput): FieldErrors {
  const e: FieldErrors = {}
  const from = v.from.trim()
  if (!from) e.from = 'Indiquez l’ancienne adresse.'
  else if (!from.startsWith('/')) e.from = 'L’ancienne adresse commence par « / », ex. /occasion/peugeot-208.'
  else if (from === '/') e.from = 'La page d’accueil ne peut pas être redirigée.'
  else if (/[\s?#]/.test(from)) e.from = 'Sans espace, ni « ? », ni « # » : seule l’adresse de la page compte.'
  else if (RESERVED.test(from)) e.from = 'Cette adresse est réservée au fonctionnement du site.'
  else if (from.length > 300) e.from = 'Adresse trop longue.'

  if (v.toType === 'reference') {
    if (!v.refId) e.refId = 'Choisissez la page de destination.'
  } else {
    const url = v.url.trim()
    if (!url) e.url = 'Indiquez la nouvelle adresse.'
    else if (!/^\/[^\s]*$/.test(url) && !/^https?:\/\/[^\s]+\.[^\s]+$/i.test(url)) e.url = 'Une adresse du site qui commence par « / », ou un lien complet en https://'
    else if (url.replace(/\/+$/, '') === from) e.url = 'La nouvelle adresse est identique à l’ancienne.'
  }
  return e
}
