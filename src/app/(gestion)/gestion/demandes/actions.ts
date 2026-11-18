'use server'

import { revalidatePath } from 'next/cache'

import { requireStaff } from '@/lib/gestion/session'
import { refusalProblem, type RefusalReason } from '@/lib/refusal-reasons'
import { DOCUMENT_KINDS, readFiles } from '@/lib/uploads'
import type { Appointment, Request } from '@/payload-types'

export type Result = { ok: true } | { ok: false; error: string }

const fail = (error: string): Result => ({ ok: false, error })

/** Message lisible pour l'équipe : droits, motif de refus manquant, ou échec générique. */
function explain(err: unknown): Result {
  console.error('[gestion/demandes]', err)
  const e = err as { status?: number; message?: string; data?: { errors?: { message?: string }[] } } | null
  if (e?.status === 403 || /forbidden|not allowed/i.test(e?.message ?? '')) return fail('Vous n’avez pas les droits sur ce dossier.')
  return fail(e?.data?.errors?.[0]?.message || 'L’enregistrement a échoué. Réessayez dans un instant.')
}

function refresh(id?: number | null) {
  revalidatePath('/gestion/demandes')
  if (id) revalidatePath(`/gestion/demandes/${id}`)
  revalidatePath('/gestion')
}

/** Demande lue avec les droits de l'utilisateur connecté. */
async function load(id: number) {
  const { payload, user } = await requireStaff()
  const request = Number.isInteger(id) && id > 0 ? await payload.findByID({ collection: 'requests', id, depth: 0, user, overrideAccess: false }).catch(() => null) : null
  return { payload, user, request }
}

/** Écrit la demande puis rafraîchit les pages de la console. */
async function save(id: number, data: Partial<Request>): Promise<Result> {
  const { payload, user } = await requireStaff()
  try {
    await payload.update({ collection: 'requests', id, data, depth: 0, user, overrideAccess: false })
  } catch (err) {
    return explain(err)
  }
  refresh(id)
  return { ok: true }
}

/** Financement : étude, accord, livraison. Contact, rappel, reprise : prise en charge puis clôture (« delivered » = traitée). */
function nextStatus(r: Request): Request['status'] | null {
  if (r.status === 'new') return 'review'
  if (r.type !== 'financing') return r.status === 'review' || r.status === 'approved' ? 'delivered' : null
  return r.status === 'review' ? 'approved' : r.status === 'approved' ? 'delivered' : null
}

/** Étape suivante. `from` = statut vu à l'écran, pour ne pas avancer deux fois sur un double clic. */
export async function advance(id: number, from: Request['status']): Promise<Result> {
  const { user, request } = await load(id)
  if (!request) return fail('Demande introuvable.')
  if (request.status !== from) return fail('Ce dossier a changé entre-temps. Actualisez la page.')
  const status = nextStatus(request)
  if (!status) return fail('Ce dossier est déjà clos.')
  // Prise en charge : le dossier revient à celui qui le prend, si personne ne le suit encore.
  return save(id, { status, ...(request.status === 'new' && !request.assignedTo ? { assignedTo: user.id } : {}) })
}

export async function refuse(id: number, reason: string, note: string): Promise<Result> {
  const problem = refusalProblem(reason, note)
  if (problem) return fail(problem)
  const { request } = await load(id)
  if (!request) return fail('Demande introuvable.')
  if (request.status === 'refused' || request.status === 'delivered') return fail('Ce dossier est déjà clos.')
  return save(id, { status: 'refused', refusalReason: reason as RefusalReason, refusalNote: note.trim().slice(0, 1000) || null })
}

export async function assign(id: number, userId: number | null): Promise<Result> {
  const { payload, request } = await load(id)
  if (!request) return fail('Demande introuvable.')
  if (userId != null) {
    // Lecture sans contrôle d'accès : un commercial ne voit pas les comptes de ses collègues.
    const member = await payload.findByID({ collection: 'users', id: userId, depth: 0, overrideAccess: true }).catch(() => null)
    if (!member || member.disabled) return fail('Ce membre de l’équipe n’existe plus ou est désactivé.')
  }
  return save(id, { assignedTo: userId })
}

export async function addNote(id: number, text: string): Promise<Result> {
  const clean = text.trim().slice(0, 4000)
  if (!clean) return fail('Écrivez la note avant de l’ajouter.')
  const { user, request } = await load(id)
  if (!request) return fail('Demande introuvable.')
  return save(id, { notes: [...(request.notes ?? []), { text: clean, author: user.id, at: new Date().toISOString() }] })
}

/** Pièces vérifiées (les relances automatiques s'arrêtent) ou dossier à nouveau incomplet. */
export async function setDocumentsComplete(id: number, complete: boolean): Promise<Result> {
  const { request } = await load(id)
  if (!request) return fail('Demande introuvable.')
  if (request.type !== 'financing') return fail('Seul un dossier de financement attend des pièces.')
  return save(id, { missingDocuments: !complete })
}

/** Dépôt de pièces par l'équipe (champs : request, kind, files). */
export async function uploadDocuments(form: FormData): Promise<Result> {
  const id = Number(form.get('request'))
  const kind = DOCUMENT_KINDS.find((k) => k === String(form.get('kind'))) ?? 'other'
  const files = readFiles(form, 'files')
  if (typeof files === 'string') return fail(files)
  if (!files.length) return fail('Choisissez au moins un fichier.')

  const { payload, user, request } = await load(id)
  if (!request) return fail('Demande introuvable.')

  let saved = 0
  let lastError: Result | null = null
  for (const file of files) {
    try {
      await payload.create({
        collection: 'documents',
        data: { request: request.id, kind },
        file: { data: Buffer.from(await file.arrayBuffer()), mimetype: file.type, name: file.name, size: file.size },
        user,
        overrideAccess: false,
      })
      saved++
    } catch (err) {
      lastError = explain(err)
    }
  }
  if (saved) refresh(id)
  if (!lastError) return { ok: true }
  return saved ? fail(`${saved} fichier(s) enregistré(s), ${files.length - saved} refusé(s). Réessayez pour les autres.`) : lastError
}

/** Suppression d'un justificatif : réservée à l'administrateur. */
export async function deleteDocument(id: number): Promise<Result> {
  const { payload, user } = await requireStaff()
  if (user.role !== 'admin') return fail('Seul un administrateur peut supprimer une pièce.')
  const doc = await payload.findByID({ collection: 'documents', id, depth: 0, user, overrideAccess: false }).catch(() => null)
  if (!doc) return fail('Fichier introuvable.')
  try {
    await payload.delete({ collection: 'documents', id, user, overrideAccess: false })
  } catch (err) {
    return explain(err)
  }
  refresh(typeof doc.request === 'object' ? doc.request?.id : doc.request)
  return { ok: true }
}

const KINDS: Appointment['kind'][] = ['test-drive', 'visit', 'delivery']

/** Rendez-vous lié à la demande (champs : request, startsAt en ISO, kind). Le client reçoit la confirmation par e-mail. */
export async function createAppointment(form: FormData): Promise<Result> {
  const id = Number(form.get('request'))
  const kind = KINDS.find((k) => k === String(form.get('kind')))
  const startsAt = new Date(String(form.get('startsAt') ?? ''))
  if (!kind) return fail('Choisissez le motif du rendez-vous.')
  if (Number.isNaN(startsAt.getTime())) return fail('Indiquez la date et l’heure du rendez-vous.')
  if (startsAt.getTime() < Date.now() - 3_600_000) return fail('Cette date est déjà passée.')

  const { payload, user, request } = await load(id)
  if (!request) return fail('Demande introuvable.')
  try {
    await payload.create({
      collection: 'appointments',
      data: {
        startsAt: startsAt.toISOString(),
        kind,
        status: 'confirmed',
        name: `${request.firstName} ${request.lastName}`.trim(),
        email: request.email,
        phone: request.phone,
        vehicle: typeof request.vehicle === 'object' ? request.vehicle?.id : request.vehicle,
        request: request.id,
      },
      user,
      overrideAccess: false,
    })
  } catch (err) {
    return explain(err)
  }
  refresh(id)
  revalidatePath('/gestion/rendez-vous')
  return { ok: true }
}
