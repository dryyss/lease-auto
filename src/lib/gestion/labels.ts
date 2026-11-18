// Libellés et couleurs partagés par toute la console « Gestion ».
import type { Appointment, Request, Vehicle } from '@/payload-types'

export const REQUEST_TYPES: Record<Request['type'], string> = {
  financing: 'Financement',
  tradein: 'Reprise',
  contact: 'Message',
  callback: 'Rappel',
}

/** Statut affiché selon le type : « Livrée » n'a de sens que pour un financement, ailleurs la demande est « Traitée ». */
export function requestStatusLabel(r: Pick<Request, 'type' | 'status'>): string {
  if (r.type !== 'financing') {
    if (r.status === 'delivered') return 'Traitée'
    if (r.status === 'refused') return 'Sans suite'
    if (r.status === 'review' || r.status === 'approved') return 'En cours'
  }
  return { new: 'Nouvelle', review: 'En étude', approved: 'Accord', delivered: 'Livrée', refused: 'Refus' }[r.status]
}

/** Classes Tailwind du badge de statut. */
export const REQUEST_STATUS_TONE: Record<Request['status'], string> = {
  new: 'bg-accent text-white',
  review: 'bg-primary text-white',
  approved: 'bg-emerald-600 text-white',
  delivered: 'bg-sky-100 text-sky-800',
  refused: 'bg-line text-ink-2',
}

/** Étapes d'un dossier, dans l'ordre (barre d'avancement de la fiche et de « Mon espace »). */
export const FINANCING_STEPS = ['Reçue', 'À l’étude', 'Accord', 'Livrée'] as const
export const SIMPLE_STEPS = ['Reçue', 'Prise en charge', 'Traitée'] as const
export function requestStep(r: Pick<Request, 'type' | 'status'>): number {
  if (r.type === 'financing') return { new: 0, review: 1, approved: 2, delivered: 3, refused: 1 }[r.status]
  return { new: 0, review: 1, approved: 1, delivered: 2, refused: 1 }[r.status]
}

export const FORMULAS: Record<string, string> = { loa: 'LOA', lld: 'LLD', credit: 'Crédit' }

export const PROFILES: Record<string, string> = {
  cdi: 'Salarié en CDI',
  cdd: 'Salarié en CDD ou intérim',
  independant: 'Indépendant, VTC, artisan',
  societe: 'Société',
  retraite: 'Retraité',
  autre: 'Autre',
}

export const APPOINTMENT_KINDS: Record<Appointment['kind'], string> = { 'test-drive': 'Essai', visit: 'Passage', delivery: 'Livraison' }
export const APPOINTMENT_STATUS: Record<Appointment['status'], string> = { confirmed: 'Confirmé', done: 'Honoré', cancelled: 'Annulé' }

export const VEHICLE_STATUS: Record<Vehicle['status'], string> = { available: 'Disponible', reserved: 'Réservé', sold: 'Vendu' }
export const VEHICLE_STATUS_TONE: Record<Vehicle['status'], string> = {
  available: 'bg-emerald-600 text-white',
  reserved: 'bg-amber-500 text-white',
  sold: 'bg-line text-ink-2',
}

export const DOCUMENT_KIND_LABELS: Record<string, string> = {
  id: 'Pièce d’identité',
  address: 'Justificatif de domicile',
  payslips: 'Bulletins de salaire',
  tax: 'Avis d’imposition',
  rib: 'RIB',
  kbis: 'Kbis / SIREN',
  accounts: 'Bilans / liasses',
  bank: 'Relevés bancaires',
  'tradein-photo': 'Photo (reprise)',
  other: 'Autre pièce',
}

export const euro = (n: number | null | undefined) => (n == null ? '—' : `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n)} €`)
export const km = (n: number | null | undefined) => (n == null ? '—' : `${new Intl.NumberFormat('fr-FR').format(n)} km`)
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`

const TZ = 'Europe/Paris'
export const fmtDate = (s: string | null | undefined) => (s ? new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ }) : '—')
export const fmtDateTime = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: TZ }) : '—'
export const fmtTime = (s: string) => new Date(s).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: TZ })

/** « il y a 3 h », « il y a 2 j ». */
export function ago(s: string): string {
  const h = Math.max(0, Math.floor((Date.now() - new Date(s).getTime()) / 3_600_000))
  if (h < 1) return 'à l’instant'
  if (h < 24) return `il y a ${h} h`
  const d = Math.floor(h / 24)
  return d < 30 ? `il y a ${d} j` : `il y a ${Math.floor(d / 30)} mois`
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n > 1 ? many : one}`
