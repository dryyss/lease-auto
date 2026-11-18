'use server'

import { revalidatePath } from 'next/cache'

import { errorMessage, fail, type Result } from '@/components/gestion/rendez-vous/result'
import { requireStaff } from '@/lib/gestion/session'

/** Désinscription complète (newsletter et alerte). La fiche et la preuve du consentement restent. */
export async function unsubscribe(id: number): Promise<Result> {
  const { payload, user } = await requireStaff()
  const s = await payload
    .findByID({ collection: 'subscribers', id, depth: 0, user, overrideAccess: false })
    .catch(() => null)
  if (!s) return fail('Cet abonné n’existe plus.')
  if (!s.newsletter && !s.alertEnabled) return fail('Cet abonné est déjà désinscrit.')
  try {
    await payload.update({
      collection: 'subscribers',
      id,
      data: { newsletter: false, alertEnabled: false },
      depth: 0,
      user,
      overrideAccess: false,
    })
  } catch (err) {
    return fail(errorMessage(err))
  }
  revalidatePath('/gestion/abonnes')
  return { ok: true }
}

/** Suppression de la fiche (demande d'effacement des données, par exemple). */
export async function deleteSubscriber(id: number): Promise<Result> {
  const { payload, user } = await requireStaff()
  const s = await payload
    .findByID({ collection: 'subscribers', id, depth: 0, user, overrideAccess: false })
    .catch(() => null)
  if (!s) return fail('Cet abonné est déjà supprimé.')
  try {
    await payload.delete({ collection: 'subscribers', id, depth: 0, user, overrideAccess: false })
  } catch (err) {
    return fail(errorMessage(err))
  }
  revalidatePath('/gestion/abonnes')
  return { ok: true }
}
