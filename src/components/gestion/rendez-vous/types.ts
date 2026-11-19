import type { Appointment } from '@/payload-types'

/** Rendez-vous réduit à ce qu'affiche la console (transmis aux composants client). */
export type Appt = {
  id: number
  startsAt: string
  kind: Appointment['kind']
  status: Appointment['status']
  name: string
  phone: string
  email: string
  vehicle: { id: number; title: string } | null
  request: { id: number; reference: string } | null
  past: boolean
  reminderSent: boolean
  /** Les e-mails partent-ils (Resend branché) ? Adapte les textes des actions. */
  emails: boolean
}

export function toAppt(a: Appointment, now: number, emails: boolean): Appt {
  const v = a.vehicle
  const r = a.request
  return {
    id: a.id,
    startsAt: a.startsAt,
    kind: a.kind,
    status: a.status,
    name: a.name,
    phone: a.phone,
    email: a.email,
    vehicle: v == null ? null : typeof v === 'object' ? { id: v.id, title: v.title } : { id: v, title: `Véhicule n° ${v}` },
    request: r == null ? null : typeof r === 'object' ? { id: r.id, reference: r.reference ?? `n° ${r.id}` } : { id: r, reference: `n° ${r}` },
    past: new Date(a.startsAt).getTime() < now,
    reminderSent: !!a.reminderSent,
    emails,
  }
}

/** Champs peuplés : juste le titre du véhicule et la référence de la demande. */
export const APPT_POPULATE = { vehicles: { title: true }, requests: { reference: true } } as const
