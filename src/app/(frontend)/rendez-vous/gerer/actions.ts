'use server'

import type { ActionResult } from '@/app/(frontend)/actions'
import { isSlotAvailable } from '@/lib/agenda'
import { appointmentTokenValid } from '@/lib/appointment-link'
import { payloadClient } from '@/lib/payload'
import { emailEnabled } from '@/lib/services'

/** Rendez-vous du lien « Gérer mon rendez-vous », s'il est valide, confirmé et encore à venir. */
async function ownAppointment(form: FormData) {
  const id = Number(form.get('id'))
  const token = String(form.get('t') ?? '')
  if (!id) return { ok: false as const, error: 'Lien incomplet. Ouvrez de nouveau le lien reçu par e-mail.' }
  const payload = await payloadClient()
  const a = await payload.findByID({ collection: 'appointments', id, depth: 0, overrideAccess: true }).catch(() => null)
  if (!a || !appointmentTokenValid(a, token)) return { ok: false as const, error: 'Ce lien n’est pas valide. Appelez-nous pour modifier votre rendez-vous.' }
  if (a.status !== 'confirmed') return { ok: false as const, error: 'Ce rendez-vous est déjà annulé ou terminé.' }
  if (new Date(a.startsAt).getTime() < Date.now()) return { ok: false as const, error: 'Ce rendez-vous est déjà passé.' }
  return { ok: true as const, payload, a }
}

/** Le client annule : le créneau est libéré, il reçoit une confirmation et l'équipe est prévenue (hook, context.by = client). */
export async function cancelMyAppointment(form: FormData): Promise<ActionResult> {
  const own = await ownAppointment(form)
  if (!own.ok) return own
  await own.payload.update({ collection: 'appointments', id: own.a.id, data: { status: 'cancelled' }, overrideAccess: true, context: { by: 'client' } })
  return { ok: true, message: emailEnabled() ? 'Votre rendez-vous est annulé. Vous allez recevoir une confirmation par e-mail.' : 'Votre rendez-vous est annulé.' }
}

/** Le client choisit un autre créneau libre : nouvel e-mail de confirmation, équipe prévenue, rappel réarmé. */
export async function moveMyAppointment(form: FormData): Promise<ActionResult> {
  const own = await ownAppointment(form)
  if (!own.ok) return own
  const startsAt = String(form.get('startsAt') ?? '')
  if (!startsAt) return { ok: false, error: 'Choisissez un jour et une heure.' }
  if (!(await isSlotAvailable(own.payload, startsAt))) return { ok: false, error: 'Ce créneau vient d’être pris. Choisissez-en un autre.' }
  await own.payload.update({ collection: 'appointments', id: own.a.id, data: { startsAt }, overrideAccess: true, context: { by: 'client' } })
  return { ok: true, message: emailEnabled() ? 'C’est noté : vous allez recevoir la confirmation du nouveau créneau par e-mail.' : 'C’est noté, nous vous attendons à ce nouveau créneau.' }
}
