'use server'

import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import { headers as nextHeaders } from 'next/headers'
import { getPayload, type Payload, type PayloadRequest } from 'payload'

import type { Request, User } from '@/payload-types'

type Result = { ok: true } | { ok: false; error: string }

/** Renvoie l’erreur réelle au bouton (au lieu d’un échec muet côté client). */
async function attempt(run: () => Promise<unknown>): Promise<Result> {
  try {
    await run()
  } catch (err) {
    console.error('[tableau de bord]', err)
    const message = err instanceof Error ? err.message : String(err)
    return {
      ok: false,
      error: /forbidden|not allowed/i.test(message)
        ? 'Vous n’avez pas les droits sur ce dossier.'
        : `Échec : ${message}`,
    }
  }
  revalidatePath('/admin')
  return { ok: true }
}

const forward: Partial<Record<Request['status'], Request['status']>> = {
  new: 'review',
  review: 'approved',
  approved: 'delivered',
}

async function staffContext(): Promise<
  { payload: Payload; user: User } | { payload: Payload; user: null }
> {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await nextHeaders() })
  if (!user || (user.role !== 'admin' && user.role !== 'commercial')) return { payload, user: null }
  return { payload, user }
}

async function loadRequest(payload: Payload, user: User, id: number) {
  return payload
    .findByID({
      collection: 'requests',
      id,
      depth: 0,
      overrideAccess: false,
      user: user as PayloadRequest['user'],
    })
    .catch(() => null)
}

export async function advanceRequest(id: number): Promise<Result> {
  const { payload, user } = await staffContext()
  if (!user) return { ok: false, error: 'Session expirée.' }
  const current = await loadRequest(payload, user, id)
  if (!current) return { ok: false, error: 'Demande introuvable.' }
  const status = forward[current.status]
  if (!status) return { ok: false, error: 'Cette demande est déjà close.' }
  return attempt(() =>
    payload.update({
      collection: 'requests',
      id,
      depth: 0,
      overrideAccess: false,
      user,
      data: {
        status,
        ...(current.status === 'new' && !current.assignedTo ? { assignedTo: user.id } : {}),
      },
    }),
  )
}

export async function refuseRequest(id: number): Promise<Result> {
  const { payload, user } = await staffContext()
  if (!user) return { ok: false, error: 'Session expirée.' }
  const current = await loadRequest(payload, user, id)
  if (!current) return { ok: false, error: 'Demande introuvable.' }
  if (current.status !== 'new' && current.status !== 'review')
    return { ok: false, error: 'Cette demande ne peut plus être refusée ici.' }
  return attempt(() =>
    payload.update({
      collection: 'requests',
      id,
      depth: 0,
      overrideAccess: false,
      user,
      data: { status: 'refused' },
    }),
  )
}

async function closeAppointment(id: number, status: 'done' | 'cancelled'): Promise<Result> {
  const { payload, user } = await staffContext()
  if (!user) return { ok: false, error: 'Session expirée.' }
  const current = await payload
    .findByID({ collection: 'appointments', id, depth: 0, overrideAccess: false, user })
    .catch(() => null)
  if (!current) return { ok: false, error: 'Rendez-vous introuvable.' }
  if (current.status !== 'confirmed') return { ok: false, error: 'Ce rendez-vous est déjà clos.' }
  if (status === 'done' && new Date(current.startsAt).getTime() > Date.now())
    return { ok: false, error: 'Ce rendez-vous n’a pas encore eu lieu.' }
  return attempt(() =>
    payload.update({
      collection: 'appointments',
      id,
      depth: 0,
      overrideAccess: false,
      user,
      data: { status },
    }),
  )
}

export async function markAppointmentDone(id: number): Promise<Result> {
  return closeAppointment(id, 'done')
}

export async function cancelAppointment(id: number): Promise<Result> {
  return closeAppointment(id, 'cancelled')
}
