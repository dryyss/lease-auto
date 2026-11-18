'use server'

import { revalidatePath } from 'next/cache'

import { normalizeFrom, TARGETS, validateRedirect, type RedirectInput, type Result } from '@/components/gestion/redirections/shared'
import { isAdminUser, requireStaff } from '@/lib/gestion/session'

async function adminContext() {
  const ctx = await requireStaff()
  return isAdminUser(ctx.user) ? ctx : null
}

function refresh(...paths: (string | undefined)[]) {
  revalidatePath('/gestion/redirections')
  // L'ancienne adresse a pu être gardée en cache comme page introuvable.
  for (const p of paths) if (p) revalidatePath(p)
}

function errorText(err: unknown) {
  const e = err as { status?: number; message?: string; data?: { errors?: { path?: string; message?: string }[] } }
  if (e?.status === 403) return 'Vous n’avez pas le droit de modifier les redirections.'
  if (e?.data?.errors?.some((x) => x.path === 'from' || /unique/i.test(x.message ?? ''))) return 'Une redirection existe déjà pour cette ancienne adresse.'
  return null
}

/** Crée ou modifie une redirection (administrateurs). */
export async function saveRedirect(input: RedirectInput): Promise<Result> {
  const ctx = await adminContext()
  if (!ctx) return { ok: false, error: 'Réservé aux administrateurs.' }
  const { payload, user } = ctx

  const v: RedirectInput = { ...input, from: normalizeFrom(input.from), url: input.url.trim() }
  const fields = validateRedirect(v)
  if (Object.keys(fields).length) return { ok: false, error: 'Vérifiez les champs signalés.', fields }
  if (!TARGETS[v.relationTo]) return { ok: false, error: 'Type de page inconnu.' }

  const ref = { user, overrideAccess: false as const, depth: 0 }
  const same = await payload.find({ collection: 'redirects', where: { from: { equals: v.from } }, limit: 1, ...ref })
  if (same.docs[0] && same.docs[0].id !== v.id) return { ok: false, error: 'Une redirection existe déjà pour cette ancienne adresse.', fields: { from: 'Déjà redirigée : modifiez la redirection existante.' } }

  if (v.toType === 'reference') {
    const target = await payload.findByID({ collection: v.relationTo, id: v.refId!, ...ref }).catch(() => null)
    if (!target) return { ok: false, error: 'La page choisie n’existe plus.', fields: { refId: 'Choisissez une autre page.' } }
  }

  const data = {
    from: v.from,
    to: v.toType === 'reference' ? { type: 'reference' as const, reference: { relationTo: v.relationTo, value: v.refId! }, url: null } : { type: 'custom' as const, reference: null, url: v.url },
  }

  try {
    let previous: string | undefined
    if (v.id) {
      previous = (await payload.findByID({ collection: 'redirects', id: v.id, ...ref })).from
      await payload.update({ collection: 'redirects', id: v.id, data, ...ref })
    } else {
      await payload.create({ collection: 'redirects', data, ...ref })
    }
    refresh(v.from, previous)
    return { ok: true }
  } catch (err) {
    const known = errorText(err)
    if (known) return { ok: false, error: known }
    payload.logger.error({ err }, 'Gestion redirections : enregistrement impossible')
    return { ok: false, error: 'L’enregistrement a échoué. Réessayez dans un instant.' }
  }
}

export async function deleteRedirect(id: number): Promise<Result> {
  const ctx = await adminContext()
  if (!ctx) return { ok: false, error: 'Réservé aux administrateurs.' }
  const { payload, user } = ctx
  try {
    const doc = await payload.delete({ collection: 'redirects', id, depth: 0, user, overrideAccess: false })
    refresh(doc.from)
    return { ok: true }
  } catch (err) {
    const known = errorText(err)
    if (known) return { ok: false, error: known }
    if ((err as { status?: number })?.status === 404) {
      refresh()
      return { ok: true }
    }
    payload.logger.error({ err }, 'Gestion redirections : suppression impossible')
    return { ok: false, error: 'La suppression a échoué. Réessayez dans un instant.' }
  }
}
