import 'server-only'

import type { Payload } from 'payload'

import type { Staff } from '@/lib/gestion/session'
import { mediaSrc } from '@/lib/media'
import type { Media, Vehicle } from '@/payload-types'

import { FORMULA_ORDER, lexicalToText, type ModelOption, type MonthlyInput, type Option, type Photo, type VehicleInput } from './shared'

/** Marques et modèles pour les listes déroulantes du formulaire. */
export async function loadOptions(payload: Payload, user: Staff): Promise<{ brands: Option[]; models: ModelOption[] }> {
  const q = { user, overrideAccess: false as const, depth: 0, pagination: false as const }
  const [b, m] = await Promise.all([
    payload.find({ collection: 'brands', sort: 'name', select: { name: true }, ...q }),
    payload.find({ collection: 'models', sort: 'name', select: { name: true, brand: true }, ...q }),
  ])
  return {
    brands: b.docs.map((d) => ({ id: d.id, name: d.name })),
    models: m.docs.map((d) => ({ id: d.id, name: d.name, brand: typeof d.brand === 'object' ? d.brand.id : d.brand })),
  }
}

const idOf = (x: unknown) => (x && typeof x === 'object' ? (x as { id: number }).id : typeof x === 'number' ? x : null)

export const toPhotos = (gallery: Vehicle['gallery'] | null | undefined): Photo[] =>
  (gallery ?? []).filter((m): m is Media => typeof m === 'object' && m !== null).map((m) => ({ id: m.id, url: mediaSrc(m, 'thumb') ?? mediaSrc(m) ?? null, alt: m.alt }))

export function emptyMonthlies(): MonthlyInput[] {
  return FORMULA_ORDER.map((formula) => ({ formula, manual: false, amount: null, months: null, deposit: null }))
}

/** Description riche (titres, listes, gras…) : la réécrire en texte simple ferait perdre la mise en forme. */
export function hasRichDescription(value: unknown): boolean {
  const root = (value as { root?: { children?: { type?: string; children?: { type?: string; format?: number }[] }[] } } | null)?.root
  return Boolean(root?.children?.some((b) => b.type !== 'paragraph' || b.children?.some((c) => (c.type !== 'text' && c.type !== 'linebreak') || (c.format ?? 0) !== 0)))
}

export function toInput(v: Vehicle): VehicleInput {
  return {
    id: v.id,
    publish: v._status === 'published',
    brand: idOf(v.brand),
    model: idOf(v.model),
    title: v.title ?? '',
    reference: v.reference ?? '',
    plate: v.plate ?? '',
    featured: Boolean(v.featured),
    status: v.status ?? 'available',
    year: v.year ?? null,
    firstRegistration: v.firstRegistration ? v.firstRegistration.slice(0, 10) : '',
    mileage: v.mileage ?? null,
    fuel: v.fuel ?? '',
    gearbox: v.gearbox ?? '',
    bodyType: v.bodyType ?? '',
    powerHp: v.powerHp ?? null,
    fiscalHp: v.fiscalHp ?? null,
    doors: v.doors ?? null,
    seats: v.seats ?? null,
    color: v.color ?? '',
    co2: v.co2 ?? null,
    critAir: v.critAir ?? '',
    warrantyMonths: v.warrantyMonths ?? null,
    price: v.price ?? null,
    monthlies: FORMULA_ORDER.map((formula) => {
      const m = v.monthlies?.find((x) => x.formula === formula)
      return { formula, manual: Boolean(m?.manual), amount: m?.amount ?? null, months: m?.months ?? null, deposit: m?.deposit ?? null }
    }),
    equipment: (v.equipment ?? []).map((e) => e.label).filter(Boolean),
    description: lexicalToText(v.description),
    gallery: (v.gallery ?? []).map(idOf).filter((x): x is number => x != null),
  }
}
