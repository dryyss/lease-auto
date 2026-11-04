const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const eurCents = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 })
const int = new Intl.NumberFormat('fr-FR')

export const formatEUR = (n: number | null | undefined) => (n == null ? '' : eur.format(n))
export const formatEURCents = (n: number | null | undefined) => (n == null ? '' : eurCents.format(n))
export const formatKm = (n: number | null | undefined) => (n == null ? '' : `${int.format(n)} km`)
export const formatPercent = (n: number | null | undefined) =>
  n == null ? '' : `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`

export const FUEL_LABELS: Record<string, string> = {
  essence: 'Essence',
  diesel: 'Diesel',
  hybride: 'Hybride',
  'hybride-rechargeable': 'Hybride rechargeable',
  electrique: 'Électrique',
  gpl: 'GPL',
}

export const GEARBOX_LABELS: Record<string, string> = { manuelle: 'Manuelle', automatique: 'Automatique' }

export const FORMULA_LABELS = { loa: 'LOA', lld: 'LLD', credit: 'Crédit auto' } as const

/** Lien tel: et wa.me à partir des numéros des Réglages. */
export const telHref = (phone?: string | null) => (phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : undefined)
export const whatsappHref = (number?: string | null, text?: string) =>
  number ? `https://wa.me/${number.replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}` : undefined
