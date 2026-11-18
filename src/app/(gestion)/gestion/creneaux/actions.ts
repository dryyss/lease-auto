'use server'

import { revalidatePath } from 'next/cache'

import { DAYS, minutes, validateAgenda, type AgendaInput, type Result } from '@/components/gestion/creneaux/shared'
import { requireStaff } from '@/lib/gestion/session'

const ORDER = DAYS.map((d) => d.value)

/** Enregistre les créneaux de rendez-vous (toute l'équipe, selon les droits du global « agenda »). */
export async function saveAgenda(v: AgendaInput): Promise<Result> {
  const { payload, user } = await requireStaff()

  const fields = validateAgenda(v)
  if (Object.keys(fields).length) return { ok: false, error: 'Certaines saisies sont à corriger (signalées en rouge).', fields }

  // Rangées dans l'ordre de la semaine, puis par heure : la liste reste lisible partout.
  const weekly = [...v.weekly]
    .sort((a, b) => ORDER.indexOf(a.day) - ORDER.indexOf(b.day) || minutes(a.from) - minutes(b.from))
    .map((w) => ({ ...(w.id ? { id: w.id } : {}), day: w.day, from: w.from, to: w.to }))
  const closures = [...v.closures]
    .sort((a, b) => a.from.localeCompare(b.from))
    .map((c) => ({ ...(c.id ? { id: c.id } : {}), from: `${c.from}T12:00:00.000Z`, to: `${c.to}T12:00:00.000Z`, reason: c.reason.trim().slice(0, 120) || null }))

  try {
    await payload.updateGlobal({
      slug: 'agenda',
      data: { slotMinutes: v.slotMinutes, minNoticeHours: v.minNoticeHours, weekly, closures },
      depth: 0,
      user,
      overrideAccess: false,
    })
  } catch (err) {
    const e = err as { status?: number; data?: { errors?: { message?: string }[] } }
    if (e?.status === 403) return { ok: false, error: 'Vous n’avez pas le droit de modifier les créneaux.' }
    if (e?.data?.errors?.length) return { ok: false, error: 'Certaines saisies sont refusées : vérifiez les heures (format HH:MM) et les dates.' }
    payload.logger.error({ err }, 'Gestion créneaux : enregistrement impossible')
    return { ok: false, error: 'L’enregistrement a échoué. Réessayez ; si cela continue, prévenez l’administrateur du site.' }
  }

  revalidatePath('/gestion/creneaux')
  // Créneaux proposés à la réservation et fermetures (statut « Fermé ») sont visibles sur le site.
  revalidatePath('/', 'layout')
  return { ok: true }
}
