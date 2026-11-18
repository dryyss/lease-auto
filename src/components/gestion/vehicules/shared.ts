// Types, libellés et petites fonctions partagés par la liste, le formulaire et les actions serveur des véhicules.
import type { Vehicle } from '@/payload-types'

export type Formula = 'loa' | 'lld' | 'credit'
export const FORMULA_ORDER: Formula[] = ['loa', 'lld', 'credit']
export const FORMULA_LABELS: Record<Formula, string> = { loa: 'LOA', lld: 'LLD', credit: 'Crédit' }

export type MonthlyInput = { formula: Formula; manual: boolean; amount: number | null; months: number | null; deposit: number | null }

/** Données envoyées par le formulaire. `description: null` = texte inchangé (on ne réécrit pas la mise en forme existante). */
export type VehicleInput = {
  id?: number
  publish: boolean
  brand: number | null
  model: number | null
  title: string
  reference: string
  plate: string
  featured: boolean
  status: Vehicle['status']
  year: number | null
  firstRegistration: string
  mileage: number | null
  fuel: Vehicle['fuel'] | ''
  gearbox: Vehicle['gearbox'] | ''
  bodyType: NonNullable<Vehicle['bodyType']> | ''
  powerHp: number | null
  fiscalHp: number | null
  doors: number | null
  seats: number | null
  color: string
  co2: number | null
  critAir: NonNullable<Vehicle['critAir']> | ''
  warrantyMonths: number | null
  price: number | null
  monthlies: MonthlyInput[]
  equipment: string[]
  description: string | null
  gallery: number[]
}

export type FieldErrors = Partial<Record<string, string>>
export type Fail = { ok: false; error: string; fields?: FieldErrors }
export type Result<T extends object = object> = ({ ok: true } & T) | Fail

export type Photo = { id: number; url: string | null; alt: string }
export type Option = { id: number; name: string }
export type ModelOption = Option & { brand: number }

export const FUEL_OPTIONS: { value: Vehicle['fuel']; label: string }[] = [
  { value: 'essence', label: 'Essence' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'hybride', label: 'Hybride' },
  { value: 'hybride-rechargeable', label: 'Hybride rechargeable' },
  { value: 'electrique', label: 'Électrique' },
  { value: 'gpl', label: 'GPL' },
]
export const GEARBOX_OPTIONS: { value: Vehicle['gearbox']; label: string }[] = [
  { value: 'manuelle', label: 'Manuelle' },
  { value: 'automatique', label: 'Automatique' },
]
export const BODY_OPTIONS: { value: NonNullable<Vehicle['bodyType']>; label: string }[] = [
  { value: 'citadine', label: 'Citadine' },
  { value: 'berline', label: 'Berline' },
  { value: 'break', label: 'Break' },
  { value: 'suv', label: 'SUV' },
  { value: 'monospace', label: 'Monospace' },
  { value: 'coupe', label: 'Coupé / cabriolet' },
  { value: 'utilitaire', label: 'Utilitaire' },
]
export const CRITAIR_OPTIONS = ['0', '1', '2', '3', '4', '5'] as const

export const FUEL_LABEL: Record<string, string> = Object.fromEntries(FUEL_OPTIONS.map((o) => [o.value, o.label]))

/** Libellés des champs, pour les messages d'erreur. */
export const FIELD_LABELS: Record<string, string> = {
  brand: 'Marque',
  model: 'Modèle',
  title: 'Titre de l’annonce',
  reference: 'Référence interne',
  plate: 'Immatriculation',
  slug: 'Adresse de l’annonce',
  status: 'Disponibilité',
  gallery: 'Photos',
  year: 'Année',
  firstRegistration: 'Mise en circulation',
  mileage: 'Kilométrage',
  fuel: 'Carburant',
  gearbox: 'Boîte',
  bodyType: 'Carrosserie',
  powerHp: 'Puissance (ch)',
  fiscalHp: 'Puissance fiscale (CV)',
  doors: 'Portes',
  seats: 'Places',
  color: 'Couleur',
  co2: 'CO₂',
  critAir: 'Crit’Air',
  warrantyMonths: 'Garantie',
  price: 'Prix',
  monthlies: 'Mensualités',
  equipment: 'Équipements',
  description: 'Description',
}

/* Immatriculation au format SIV (AB-123-CD). */
const SIV = /^([A-Z]{2})(\d{3})([A-Z]{2})$/
export function formatPlate(value: string): string {
  const compact = value.toUpperCase().replace(/[\s-]+/g, '')
  const m = compact.match(SIV)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : value.toUpperCase().trim()
}
export const isSivPlate = (value: string) => SIV.test(value.toUpperCase().replace(/[\s-]+/g, ''))

/** Titre proposé quand le champ est vide. */
export const suggestTitle = (brand?: string, model?: string) => [brand, model].filter(Boolean).join(' ')

/** Contrôle avant l'envoi (navigateur et serveur). Un brouillon ne demande qu'un titre ; la mise en ligne demande le reste. */
export function validateVehicle(v: VehicleInput): FieldErrors {
  const e: FieldErrors = {}
  const year = new Date().getFullYear() + 1
  if (!v.title.trim()) e.title = 'Indiquez le titre de l’annonce (ou choisissez la marque et le modèle).'
  if (v.year != null && (!Number.isInteger(v.year) || v.year < 1990 || v.year > year)) e.year = `Année entre 1990 et ${year}.`
  if (v.mileage != null && (!Number.isFinite(v.mileage) || v.mileage < 0)) e.mileage = 'Le kilométrage ne peut pas être négatif.'
  if (v.price != null && (!Number.isFinite(v.price) || v.price < 0)) e.price = 'Le prix ne peut pas être négatif.'
  for (const k of ['powerHp', 'fiscalHp', 'doors', 'seats', 'co2', 'warrantyMonths'] as const) {
    const n = v[k]
    if (n != null && (!Number.isFinite(n) || n < 0)) e[k] = 'Valeur négative impossible.'
  }
  for (const m of v.monthlies) {
    if (m.manual && (m.amount == null || m.amount <= 0)) e.monthlies = `Saisie manuelle ${FORMULA_LABELS[m.formula]} : indiquez la mensualité.`
  }
  if (v.publish) {
    if (!v.brand) e.brand = 'Choisissez la marque.'
    if (!v.model) e.model = 'Choisissez le modèle.'
    if (v.year == null) e.year ??= 'Indiquez l’année.'
    if (v.mileage == null) e.mileage ??= 'Indiquez le kilométrage.'
    if (!v.fuel) e.fuel = 'Choisissez le carburant.'
    if (!v.gearbox) e.gearbox = 'Choisissez la boîte.'
    if (v.price == null || v.price <= 0) e.price ??= 'Indiquez le prix.'
    if (!v.gallery.length) e.gallery = 'Ajoutez au moins une photo pour mettre l’annonce en ligne.'
  }
  return e
}

/* Description : texte simple <-> paragraphes Lexical. Une ligne vide sépare deux paragraphes. */
type LexNode = { type?: string; text?: string; children?: LexNode[] }

export function lexicalToText(value: unknown): string {
  const root = (value as { root?: LexNode } | null)?.root
  if (!root?.children) return ''
  const inline = (n: LexNode): string => {
    if (n.type === 'linebreak') return '\n'
    if (typeof n.text === 'string') return n.text
    if (n.type === 'listitem') return `- ${(n.children ?? []).map(inline).join('')}\n`
    return (n.children ?? []).map(inline).join('')
  }
  return root.children
    .map((b) => inline(b).replace(/\n+$/, ''))
    .filter((t) => t.trim())
    .join('\n\n')
}

export function textToLexical(text: string) {
  const textNode = (t: string) => ({ type: 'text', text: t, format: 0, detail: 0, mode: 'normal', style: '', version: 1 })
  const paragraphs = text
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (!paragraphs.length) return null
  return {
    root: {
      type: 'root',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      children: paragraphs.map((p) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        textFormat: 0,
        children: p.split('\n').flatMap((line, i) => (i ? [{ type: 'linebreak', version: 1 }, textNode(line)] : [textNode(line)])),
      })),
    },
  }
}

/** Liste collée (une ligne par équipement, puces retirées). */
export const parseList = (text: string) =>
  text
    .split(/\r?\n|;/)
    .map((l) => l.replace(/^\s*(?:[-•*·–]|\d+[.)])\s*/, '').trim())
    .filter(Boolean)
