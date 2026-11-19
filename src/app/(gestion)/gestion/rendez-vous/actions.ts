'use server'

import { revalidatePath } from 'next/cache'

import { parseDay } from '@/components/gestion/rendez-vous/dates'
import { errorMessage, fail, isEmail, isPhone, text, type Result } from '@/components/gestion/rendez-vous/result'
import { isSlotAvailable, parisTime } from '@/lib/agenda'
import { fmtTime } from '@/lib/gestion/labels'
import { requireStaff } from '@/lib/gestion/session'
import { notifyAppointment } from '@/lib/notifications'
import { emailEnabled } from '@/lib/services'
import type { Appointment } from '@/payload-types'

const refresh = () => {
  revalidatePath('/gestion/rendez-vous')
  revalidatePath('/gestion/clients')
  revalidatePath('/gestion')
}

/** « Honoré », « Pas venu » ou « Annuler » : seul un rendez-vous encore « confirmé » peut changer de statut. */
export async function setAppointmentStatus(id: number, status: 'done' | 'cancelled'): Promise<Result> {
  if (status !== 'done' && status !== 'cancelled') return fail('Statut inconnu.')
  const { payload, user } = await requireStaff()
  const current = await payload.findByID({ collection: 'appointments', id, depth: 0, user, overrideAccess: false }).catch(() => null)
  if (!current) return fail('Ce rendez-vous est introuvable. Il a peut-être été supprimé.')
  if (current.status !== 'confirmed') return fail('Ce rendez-vous est déjà clôturé (honoré ou annulé).')
  if (status === 'done' && new Date(current.startsAt).getTime() > Date.now())
    return fail('Ce rendez-vous n’a pas encore eu lieu : vous pourrez le marquer « Honoré » après l’heure prévue.')
  try {
    // Annulation avant l'heure : le client est prévenu par e-mail (hook). « Honoré » ou « Pas venu » : rien à lui écrire.
    const past = new Date(current.startsAt).getTime() <= Date.now()
    await payload.update({ collection: 'appointments', id, data: { status }, depth: 0, user, overrideAccess: false, context: { skipEmails: status === 'done' || past } })
  } catch (err) {
    return fail(errorMessage(err))
  }
  refresh()
  return { ok: true }
}

type Staff = Awaited<ReturnType<typeof requireStaff>>

/** Créneau déjà pris (hors `exceptId`) ou hors des créneaux publics : message d'avertissement, sinon null. */
async function slotWarning({ payload, user }: Staff, at: number, exceptId?: number): Promise<string | null> {
  const agenda = await payload.findGlobal({ slug: 'agenda', depth: 0 })
  const slotMs = (agenda.slotMinutes ?? 45) * 60_000
  const clash = await payload.find({
    collection: 'appointments',
    where: {
      and: [
        { status: { equals: 'confirmed' } },
        { startsAt: { greater_than: new Date(at - slotMs).toISOString() } },
        { startsAt: { less_than: new Date(at + slotMs).toISOString() } },
        ...(exceptId ? [{ id: { not_equals: exceptId } }] : []),
      ],
    },
    limit: 1,
    depth: 0,
    select: { name: true, startsAt: true },
    user,
    overrideAccess: false,
  })
  const other = clash.docs[0]
  if (other) return `Ce créneau est déjà pris : ${other.name} a rendez-vous à ${fmtTime(other.startsAt)}. Vous pouvez quand même le choisir.`
  if (!(await isSlotAvailable(payload, new Date(at).toISOString())))
    return 'Ce créneau ne fait pas partie des créneaux proposés au public (hors des plages, jour de fermeture ou trop proche). Vous pouvez quand même le choisir.'
  return null
}

/** Date + heure d'un formulaire de la console, à l'heure de Paris. */
function readWhen(form: FormData): { at: number } | { error: string } {
  const day = parseDay(text(form, 'date', 10))
  const time = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(text(form, 'time', 5))
  if (!day || !time) return { error: 'Indiquez la date et l’heure du rendez-vous.' }
  const at = parisTime(day.y, day.m, day.d, Number(time[1]), Number(time[2]))
  if (at < Date.now() - 5 * 60_000) return { error: 'Cette date est déjà passée. Choisissez une date à venir.' }
  return { at }
}

export type CreateResult = { ok: true; date: string } | { ok: false; error: string; warning?: boolean }

const KINDS: Appointment['kind'][] = ['test-drive', 'visit', 'delivery']

/**
 * Rendez-vous pris par l'équipe (téléphone, agence). Le client reçoit l'e-mail de confirmation par le hook de la collection.
 * Créneau déjà pris ou hors des créneaux publics : avertissement, puis création possible avec « force ».
 */
export async function createAppointment(form: FormData): Promise<CreateResult> {
  const { payload, user } = await requireStaff()
  const name = text(form, 'name', 120)
  const email = text(form, 'email', 160).toLowerCase()
  const phone = text(form, 'phone', 30)
  const kind = KINDS.find((k) => k === text(form, 'kind')) ?? null
  const vehicleId = Number(form.get('vehicle')) || null

  if (!name) return { ok: false, error: 'Indiquez le nom du client.' }
  if (!isPhone(phone)) return { ok: false, error: 'Indiquez un numéro de téléphone valide.' }
  if (!isEmail(email)) return { ok: false, error: 'Indiquez une adresse e-mail valide : le client y reçoit la confirmation.' }
  if (!kind) return { ok: false, error: 'Choisissez le motif du rendez-vous.' }
  const w = readWhen(form)
  if ('error' in w) return { ok: false, error: w.error }
  const at = w.at
  const iso = new Date(at).toISOString()

  if (vehicleId) {
    const found = await payload.count({ collection: 'vehicles', where: { id: { equals: vehicleId } }, user, overrideAccess: false })
    if (!found.totalDocs) return { ok: false, error: 'Ce véhicule est introuvable. Choisissez-en un autre ou laissez le champ vide.' }
  }

  if (form.get('force') !== '1') {
    const warning = await slotWarning({ payload, user }, at)
    if (warning) return { ok: false, warning: true, error: warning }
  }

  try {
    await payload.create({
      collection: 'appointments',
      data: { name, email, phone, kind, startsAt: iso, status: 'confirmed', vehicle: vehicleId },
      depth: 0,
      user,
      overrideAccess: false,
    })
  } catch (err) {
    return { ok: false, error: errorMessage(err) }
  }
  refresh()
  return { ok: true, date: text(form, 'date', 10) }
}

/** « Décaler » : nouvel horaire ; le client reçoit un e-mail avec le nouveau créneau (hook), le rappel repart. */
export async function moveAppointment(form: FormData): Promise<CreateResult> {
  const staff = await requireStaff()
  const { payload, user } = staff
  const id = Number(form.get('id'))
  const current = await payload.findByID({ collection: 'appointments', id, depth: 0, user, overrideAccess: false }).catch(() => null)
  if (!current) return { ok: false, error: 'Ce rendez-vous est introuvable. Il a peut-être été supprimé.' }
  if (current.status !== 'confirmed') return { ok: false, error: 'Seul un rendez-vous confirmé peut être décalé.' }
  const w = readWhen(form)
  if ('error' in w) return { ok: false, error: w.error }
  if (w.at === new Date(current.startsAt).getTime()) return { ok: false, error: 'C’est déjà l’horaire du rendez-vous. Choisissez un autre créneau.' }
  if (form.get('force') !== '1') {
    const warning = await slotWarning(staff, w.at, id)
    if (warning) return { ok: false, warning: true, error: warning }
  }
  try {
    await payload.update({ collection: 'appointments', id, data: { startsAt: new Date(w.at).toISOString() }, depth: 0, user, overrideAccess: false })
  } catch (err) {
    return { ok: false, error: errorMessage(err) }
  }
  refresh()
  return { ok: true, date: text(form, 'date', 10) }
}

/** Renvoie l'e-mail de confirmation au client (adresse corrigée, e-mail perdu…). */
export async function resendAppointmentConfirmation(id: number): Promise<Result> {
  const { payload, user } = await requireStaff()
  if (!emailEnabled()) return fail('Les e-mails ne sont pas encore branchés (Resend) : prévenez le client par téléphone.')
  const current = await payload.findByID({ collection: 'appointments', id, depth: 0, user, overrideAccess: false }).catch(() => null)
  if (!current || current.status !== 'confirmed') return fail('Ce rendez-vous n’est plus confirmé.')
  const sent = await notifyAppointment(payload, current, { team: false })
  return sent ? { ok: true } : fail('L’e-mail n’a pas pu partir. Vérifiez l’adresse du client, ou réessayez plus tard.')
}
