// Réglages du site (global « settings ») : forme des données du formulaire et contrôles,
// partagés entre le navigateur et l'action serveur.

import type { Setting } from '@/payload-types'

export type FormulaKey = 'loa' | 'lld' | 'credit'
export const FORMULA_KEYS: FormulaKey[] = ['loa', 'lld', 'credit']

export type FormulaInput = {
  enabled: boolean
  annualRate: number | null
  taeg: number | null
  minMonths: number | null
  maxMonths: number | null
  defaultMonths: number | null
  defaultDepositPercent: number | null
  residualPercent: number | null // LOA et LLD seulement
  representativeExample: string
}

export type SettingsInput = {
  company: {
    name: string
    legalForm: string
    siren: string
    rcs: string
    orias: string
    address: string
    postalCode: string
    city: string
    phone: string
    whatsapp: string
    email: string
    notificationEmails: string[]
    mapsUrl: string
    googleReviewUrl: string
  }
  openingHours: { id?: string | null; days: string; hours: string }[]
  social: { facebook: string; instagram: string; tiktok: string }
  financing: Record<FormulaKey, FormulaInput> & { legalNotice: string }
  retention: { soldVisibleDays: number | null; documentsDays: number | null; internalReminderHours: number | null; reviewRequestDays: number | null }
  /** Textes riches en Markdown ; null = non modifié (la version enregistrée est conservée telle quelle). */
  legal: { legalNotice: string | null; privacyPolicy: string | null; terms: string | null }
}

export type FieldErrors = Record<string, string>
export type Result = { ok: true } | { ok: false; error: string; fields?: FieldErrors }

const s = (v: string | null | undefined) => v ?? ''

/** Document Payload → valeurs du formulaire (les textes riches sont fournis à part, déjà en Markdown). */
export function toInput(doc: Setting, legal: SettingsInput['legal']): SettingsInput {
  const c = doc.company ?? {}
  const f = doc.financing ?? {}
  const formula = (k: FormulaKey): FormulaInput => {
    const x: NonNullable<NonNullable<Setting['financing']>['loa']> = f[k] ?? {}
    return {
      enabled: x.enabled ?? true,
      annualRate: x.annualRate ?? null,
      taeg: x.taeg ?? null,
      minMonths: x.minMonths ?? null,
      maxMonths: x.maxMonths ?? null,
      defaultMonths: x.defaultMonths ?? null,
      defaultDepositPercent: x.defaultDepositPercent ?? null,
      residualPercent: x.residualPercent ?? null,
      representativeExample: s(x.representativeExample),
    }
  }
  return {
    company: {
      name: s(c.name),
      legalForm: s(c.legalForm),
      siren: s(c.siren),
      rcs: s(c.rcs),
      orias: s(c.orias),
      address: s(c.address),
      postalCode: s(c.postalCode),
      city: s(c.city),
      phone: s(c.phone),
      whatsapp: s(c.whatsapp),
      email: s(c.email),
      notificationEmails: c.notificationEmails ?? [],
      mapsUrl: s(c.mapsUrl),
      googleReviewUrl: s(c.googleReviewUrl),
    },
    openingHours: (doc.openingHours ?? []).map((h) => ({ id: h.id, days: h.days, hours: h.hours })),
    social: { facebook: s(doc.social?.facebook), instagram: s(doc.social?.instagram), tiktok: s(doc.social?.tiktok) },
    financing: { loa: formula('loa'), lld: formula('lld'), credit: formula('credit'), legalNotice: s(f.legalNotice) },
    retention: {
      soldVisibleDays: doc.retention?.soldVisibleDays ?? null,
      documentsDays: doc.retention?.documentsDays ?? null,
      internalReminderHours: doc.retention?.internalReminderHours ?? null,
      reviewRequestDays: doc.retention?.reviewRequestDays ?? null,
    },
    legal,
  }
}

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
const isUrl = (v: string) => /^https?:\/\/[^\s]+\.[^\s]+$/i.test(v)

/** Ordre d'affichage : sert à placer le curseur sur la première erreur. */
export const FIELD_ORDER = [
  'company.name',
  'company.siren',
  'company.phone',
  'company.whatsapp',
  'company.email',
  'company.notificationEmails',
  'company.mapsUrl',
  'company.googleReviewUrl',
  'openingHours',
  'social.facebook',
  'social.instagram',
  'social.tiktok',
  ...FORMULA_KEYS.flatMap((k) => ['annualRate', 'taeg', 'minMonths', 'maxMonths', 'defaultMonths', 'defaultDepositPercent', 'residualPercent'].map((n) => `financing.${k}.${n}`)),
  'financing.legalNotice',
  'retention.soldVisibleDays',
  'retention.documentsDays',
  'retention.internalReminderHours',
  'retention.reviewRequestDays',
]

/** Contrôles avant enregistrement. Clés = chemin du champ (ex. « financing.loa.taeg »). */
export function validateSettings(v: SettingsInput): FieldErrors {
  const e: FieldErrors = {}
  const c = v.company
  if (!c.name.trim()) e['company.name'] = 'Indiquez la raison sociale : elle apparaît dans les mentions légales et les e-mails.'
  if (c.siren.trim() && !/^\d{9}$/.test(c.siren.replace(/\s/g, ''))) e['company.siren'] = 'Le SIREN compte 9 chiffres.'
  if (c.phone.trim() && c.phone.replace(/\D/g, '').length < 9) e['company.phone'] = 'Numéro incomplet.'
  if (c.whatsapp.trim() && !/^\d{8,15}$/.test(c.whatsapp.trim())) e['company.whatsapp'] = 'Chiffres uniquement, avec l’indicatif du pays et sans le 0 : ex. 33612345678.'
  if (c.email.trim() && !isEmail(c.email.trim())) e['company.email'] = 'Adresse e-mail non valable.'
  const bad = c.notificationEmails.map((m) => m.trim()).filter((m) => m && !isEmail(m))
  if (bad.length) e['company.notificationEmails'] = `Adresse non valable : ${bad.join(', ')}.`
  if (c.mapsUrl.trim() && !isUrl(c.mapsUrl.trim())) e['company.mapsUrl'] = 'Collez le lien complet, qui commence par https://'
  if (c.googleReviewUrl.trim() && !isUrl(c.googleReviewUrl.trim())) e['company.googleReviewUrl'] = 'Collez le lien complet, qui commence par https://'

  v.openingHours.forEach((h, i) => {
    if (!h.days.trim()) e[`openingHours.${i}.days`] = 'Indiquez les jours.'
    if (!h.hours.trim()) e[`openingHours.${i}.hours`] = 'Indiquez les horaires (ou « Fermé »).'
  })
  if (v.openingHours.some((_, i) => e[`openingHours.${i}.days`] || e[`openingHours.${i}.hours`])) e.openingHours = 'Complétez chaque ligne d’horaires, ou retirez-la.'

  for (const k of ['facebook', 'instagram', 'tiktok'] as const) {
    if (v.social[k].trim() && !isUrl(v.social[k].trim())) e[`social.${k}`] = 'Collez le lien complet de la page, qui commence par https://'
  }

  for (const k of FORMULA_KEYS) {
    const f = v.financing[k]
    const p = `financing.${k}`
    const range = (name: keyof FormulaInput, min: number, max: number, msg: string) => {
      const n = f[name]
      if (typeof n === 'number' && (!Number.isFinite(n) || n < min || n > max)) e[`${p}.${name}`] = msg
    }
    range('annualRate', 0, 30, 'Entre 0 et 30 %.')
    range('taeg', 0, 30, 'Entre 0 et 30 %.')
    range('minMonths', 1, 120, 'Entre 1 et 120 mois.')
    range('maxMonths', 1, 120, 'Entre 1 et 120 mois.')
    range('defaultMonths', 1, 120, 'Entre 1 et 120 mois.')
    range('defaultDepositPercent', 0, 90, 'Entre 0 et 90 %.')
    if (k !== 'credit') range('residualPercent', 0, 90, 'Entre 0 et 90 %.')
    if (f.minMonths != null && f.maxMonths != null && f.minMonths > f.maxMonths) e[`${p}.maxMonths`] = 'La durée maximale doit être supérieure à la durée minimale.'
    if (f.defaultMonths != null && ((f.minMonths != null && f.defaultMonths < f.minMonths) || (f.maxMonths != null && f.defaultMonths > f.maxMonths))) {
      e[`${p}.defaultMonths`] = 'Choisissez une durée comprise entre le minimum et le maximum.'
    }
  }
  if (!v.financing.legalNotice.trim()) e['financing.legalNotice'] = 'Cette mention est obligatoire sur toute publicité pour un crédit.'

  for (const k of ['soldVisibleDays', 'documentsDays', 'internalReminderHours', 'reviewRequestDays'] as const) {
    const n = v.retention[k]
    if (n != null && (!Number.isInteger(n) || n < 0 || n > 3650)) e[`retention.${k}`] = 'Nombre entier positif.'
  }
  return e
}

/** Libellés courts pour le message « À corriger : … ». */
export function fieldName(key: string): string {
  const [group, a, b] = key.split('.')
  const FORM: Record<string, string> = { loa: 'LOA', lld: 'LLD', credit: 'Crédit' }
  const NAMES: Record<string, string> = {
    name: 'raison sociale',
    siren: 'SIREN',
    phone: 'téléphone',
    whatsapp: 'WhatsApp',
    email: 'e-mail de contact',
    notificationEmails: 'e-mails des notifications',
    mapsUrl: 'lien Google Maps',
    googleReviewUrl: 'lien des avis Google',
    facebook: 'Facebook',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    annualRate: 'taux débiteur',
    taeg: 'TAEG',
    minMonths: 'durée min',
    maxMonths: 'durée max',
    defaultMonths: 'durée affichée',
    defaultDepositPercent: 'apport',
    residualPercent: 'valeur résiduelle',
    legalNotice: 'mention obligatoire',
    soldVisibleDays: 'affichage des vendus',
    documentsDays: 'conservation des justificatifs',
    internalReminderHours: 'relance interne',
    reviewRequestDays: 'demande d’avis',
  }
  if (group === 'openingHours') return 'horaires'
  if (group === 'financing' && FORM[a]) return `${FORM[a]} : ${NAMES[b] ?? b}`
  return NAMES[a] ?? key
}

/** Identifiant HTML d'un champ à partir de son chemin. */
export const fid = (key: string) => `f-${key.replace(/\./g, '-')}`
