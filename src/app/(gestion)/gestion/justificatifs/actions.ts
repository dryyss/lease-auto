'use server'

import { revalidatePath } from 'next/cache'

import { errorMessage, fail, type Result } from '@/components/gestion/rendez-vous/result'
import { isAdminUser, requireStaff } from '@/lib/gestion/session'

/** Suppression définitive d'un justificatif (fichier et fiche) : administrateur uniquement. */
export async function deleteJustificatif(id: number): Promise<Result> {
  const { payload, user } = await requireStaff()
  if (!isAdminUser(user)) return fail('Seul un administrateur peut supprimer un justificatif.')
  const doc = await payload
    .findByID({ collection: 'documents', id, depth: 0, user, overrideAccess: false })
    .catch(() => null)
  if (!doc) return fail('Ce justificatif est déjà supprimé.')
  try {
    await payload.delete({ collection: 'documents', id, depth: 0, user, overrideAccess: false })
  } catch (err) {
    return fail(errorMessage(err))
  }
  revalidatePath('/gestion/justificatifs')
  const requestId = typeof doc.request === 'object' ? doc.request?.id : doc.request
  if (requestId) revalidatePath(`/gestion/demandes/${requestId}`)
  return { ok: true }
}
