import { createHmac, timingSafeEqual } from 'node:crypto'

import { siteUrl } from './email'

// Lien « Gérer mon rendez-vous » envoyé au client : il porte l'identifiant du rendez-vous et une signature liée à son e-mail.
// Pas de compte ni de mot de passe : seul celui qui a reçu l'e-mail peut annuler ou décaler.

const sign = (id: number, email: string) =>
  createHmac('sha256', `${process.env.PAYLOAD_SECRET ?? ''}:rendez-vous`).update(`${id}.${email.trim().toLowerCase()}`).digest('base64url').slice(0, 32)

export const appointmentToken = (a: { id: number; email: string }) => sign(a.id, a.email)

export function appointmentTokenValid(a: { id: number; email: string }, token: string | undefined | null) {
  if (!token) return false
  const expected = Buffer.from(sign(a.id, a.email))
  const given = Buffer.from(token)
  return expected.length === given.length && timingSafeEqual(expected, given)
}

/** Chemin relatif (pour le site) ; `absolute` pour les e-mails. */
export const manageAppointmentPath = (a: { id: number; email: string }) => `/rendez-vous/gerer?id=${a.id}&t=${appointmentToken(a)}`
export const manageAppointmentUrl = (a: { id: number; email: string }) => `${siteUrl()}${manageAppointmentPath(a)}`
