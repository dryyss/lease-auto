// Créneaux de rendez-vous (global « agenda ») : données du formulaire et contrôles, partagés navigateur / serveur.

import type { Agenda } from '@/payload-types'

export type Day = NonNullable<Agenda['weekly']>[number]['day']
export type WeeklyRange = { id?: string | null; day: Day; from: string; to: string }
export type Closure = { id?: string | null; from: string; to: string; reason: string } // dates AAAA-MM-JJ

export type AgendaInput = {
  slotMinutes: number | null
  minNoticeHours: number | null
  weekly: WeeklyRange[]
  closures: Closure[]
}

export type FieldErrors = Record<string, string>
export type Result = { ok: true } | { ok: false; error: string; fields?: FieldErrors }

/** Jours dans l'ordre d'affichage (lundi d'abord). Valeur = getDay(). */
export const DAYS: { value: Day; label: string }[] = [
  { value: '1', label: 'Lundi' },
  { value: '2', label: 'Mardi' },
  { value: '3', label: 'Mercredi' },
  { value: '4', label: 'Jeudi' },
  { value: '5', label: 'Vendredi' },
  { value: '6', label: 'Samedi' },
  { value: '0', label: 'Dimanche' },
]

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/
export const isTime = (t: string) => HHMM.test(t)
export const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

/** Date enregistrée → AAAA-MM-JJ (jour de Paris). */
export const toDay = (iso: string) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso))

export function toInput(doc: Agenda): AgendaInput {
  return {
    slotMinutes: doc.slotMinutes ?? 45,
    minNoticeHours: doc.minNoticeHours ?? 4,
    weekly: (doc.weekly ?? []).map((w) => ({ id: w.id, day: w.day, from: w.from, to: w.to })),
    closures: (doc.closures ?? []).map((c) => ({ id: c.id, from: toDay(c.from), to: toDay(c.to), reason: c.reason ?? '' })),
  }
}

/** Contrôles. Clés : slotMinutes, minNoticeHours, weekly.<index>, closures.<index>.from|to. */
export function validateAgenda(v: AgendaInput): FieldErrors {
  const e: FieldErrors = {}
  if (v.slotMinutes == null || !Number.isInteger(v.slotMinutes) || v.slotMinutes < 15 || v.slotMinutes > 480) e.slotMinutes = 'Entre 15 et 480 minutes.'
  if (v.minNoticeHours == null || !Number.isInteger(v.minNoticeHours) || v.minNoticeHours < 0 || v.minNoticeHours > 720) e.minNoticeHours = 'Nombre d’heures entier, entre 0 et 720.'

  v.weekly.forEach((w, i) => {
    if (!DAYS.some((d) => d.value === w.day)) e[`weekly.${i}`] = 'Jour inconnu.'
    else if (!isTime(w.from) || !isTime(w.to)) e[`weekly.${i}`] = 'Heures au format HH:MM, ex. 09:30.'
    else if (minutes(w.from) >= minutes(w.to)) e[`weekly.${i}`] = 'L’heure de fin doit être après l’heure de début.'
  })
  // Plages qui se chevauchent le même jour.
  for (const d of DAYS) {
    const list = v.weekly.map((w, i) => ({ ...w, i })).filter((w) => w.day === d.value && !e[`weekly.${w.i}`])
    list.sort((a, b) => minutes(a.from) - minutes(b.from))
    for (let k = 1; k < list.length; k++) {
      if (minutes(list[k].from) < minutes(list[k - 1].to)) e[`weekly.${list[k].i}`] = `Chevauche la plage ${list[k - 1].from}–${list[k - 1].to}.`
    }
  }

  v.closures.forEach((c, i) => {
    if (!ISO_DAY.test(c.from)) e[`closures.${i}.from`] = 'Choisissez la date de début.'
    if (!ISO_DAY.test(c.to)) e[`closures.${i}.to`] = 'Choisissez la date de fin.'
    else if (ISO_DAY.test(c.from) && c.to < c.from) e[`closures.${i}.to`] = 'La date de fin doit être le même jour ou après le début.'
  })
  return e
}

export const fid = (key: string) => `f-${key.replace(/\./g, '-')}`
