// Petits utilitaires d'affichage des demandes (serveur et navigateur).
import { FORMULAS, REQUEST_TYPES } from '@/lib/gestion/labels'
import type { Request } from '@/payload-types'

export const PER_PAGE = 25
const DAY = 86_400_000

/** Identifiant d'une relation, qu'elle soit peuplée ou non. */
export const idOf = (rel: number | { id: number } | null | undefined) => (rel == null ? null : typeof rel === 'object' ? rel.id : rel)

export const fullName = (r: Pick<Request, 'firstName' | 'lastName'>) => `${r.firstName} ${r.lastName}`.trim()

export const fileUrl = (filename: string) => `/api/documents/file/${encodeURIComponent(filename)}`

export const trackingUrl = (reference: string) => `${process.env.NEXT_PUBLIC_SERVER_URL ?? ''}/mon-espace?ref=${encodeURIComponent(reference)}`

/** Lien WhatsApp au format international (06… → 336…). */
export function whatsappHref(phone: string) {
  let d = phone.replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  else if (d.startsWith('0')) d = `33${d.slice(1)}`
  return `https://wa.me/${d}`
}

/** Nouvelle depuis plus de 24 h. */
export const isLate = (r: Pick<Request, 'status' | 'createdAt'>) => r.status === 'new' && Date.now() - new Date(r.createdAt).getTime() > DAY

export const lateBefore = () => new Date(Date.now() - DAY).toISOString()

/** Financement encore à l'étude dont les pièces ne sont pas toutes là. */
export const hasMissingDocs = (r: Pick<Request, 'type' | 'status' | 'missingDocuments'>) =>
  r.type === 'financing' && !!r.missingDocuments && (r.status === 'new' || r.status === 'review')

/** « Financement · Peugeot 3008 · LOA » ou « Reprise · Clio 2016 ». */
export function projectLine(r: Pick<Request, 'type' | 'vehicle' | 'formula' | 'tradeIn'>) {
  const vehicle = r.vehicle && typeof r.vehicle === 'object' ? r.vehicle.title : null
  const tradeIn = r.type === 'tradein' ? [r.tradeIn?.brand, r.tradeIn?.model, r.tradeIn?.year].filter(Boolean).join(' ') : ''
  return [REQUEST_TYPES[r.type], vehicle || tradeIn, r.formula ? FORMULAS[r.formula] : null].filter(Boolean).join(' · ')
}
