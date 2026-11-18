// Filtres et mise en forme des abonnés, partagés par la liste et l'export CSV.
import type { Where } from 'payload'

import { FUEL_LABEL } from '@/components/gestion/vehicules/shared'
import type { Subscriber } from '@/payload-types'

export const SUBSCRIBER_FILTERS = [
  { key: '', label: 'Tous' },
  { key: 'newsletter', label: 'Newsletter' },
  { key: 'alerte', label: 'Alerte véhicule' },
  { key: 'desinscrits', label: 'Désinscrits' },
] as const
export type SubscriberFilter = (typeof SUBSCRIBER_FILTERS)[number]['key']

export const parseFilter = (v: unknown): SubscriberFilter =>
  SUBSCRIBER_FILTERS.find((f) => f.key === v)?.key ?? ''

export function subscriberWhere(q: string, filtre: SubscriberFilter): Where {
  const and: Where[] = []
  const s = q.trim().slice(0, 100)
  if (s) and.push({ or: [{ email: { contains: s } }, { firstName: { contains: s } }] })
  if (filtre === 'newsletter') and.push({ newsletter: { equals: true } })
  if (filtre === 'alerte') and.push({ alertEnabled: { equals: true } })
  if (filtre === 'desinscrits')
    and.push({ newsletter: { not_equals: true } }, { alertEnabled: { not_equals: true } })
  return { and }
}

const n = (v: number) => new Intl.NumberFormat('fr-FR').format(v)

/** Critères d'alerte en clair : « Peugeot, Renault · 20 000 € max · Diesel ». */
export function criteriaParts(
  c: Subscriber['criteria'],
  brandName: (id: number) => string | undefined,
) {
  const brands = (c?.brands ?? [])
    .map((b) => (typeof b === 'object' ? b.name : brandName(b)))
    .filter(Boolean) as string[]
  return {
    brands: brands.join(', '),
    maxPrice: c?.maxPrice ? `${n(c.maxPrice)} € max` : '',
    maxMonthly: c?.maxMonthly ? `${n(c.maxMonthly)} €/mois max` : '',
    maxMileage: c?.maxMileage ? `${n(c.maxMileage)} km max` : '',
    fuels: (c?.fuels ?? []).map((f) => FUEL_LABEL[f] ?? f).join(', '),
  }
}

export function criteriaText(
  c: Subscriber['criteria'],
  brandName: (id: number) => string | undefined,
) {
  const p = criteriaParts(c, brandName)
  return [p.brands || 'Toutes marques', p.maxPrice, p.maxMonthly, p.maxMileage, p.fuels]
    .filter(Boolean)
    .join(' · ')
}
