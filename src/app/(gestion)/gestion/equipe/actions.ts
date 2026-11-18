'use server'

import { revalidatePath } from 'next/cache'
import type { Payload } from 'payload'

import { errorMessage, fail, isEmail, text, type Result } from '@/components/gestion/rendez-vous/result'
import { isAdminUser, requireStaff, type Staff } from '@/lib/gestion/session'
import type { User } from '@/payload-types'

const refresh = () => {
  revalidatePath('/gestion/equipe')
  revalidatePath('/gestion')
}

const ROLES: User['role'][] = ['admin', 'commercial']

async function adminContext() {
  const ctx = await requireStaff()
  return isAdminUser(ctx.user) ? ctx : null
}

/** Administrateurs dont l'accès est actif (le champ « disabled » peut être vide). */
async function activeAdmins(payload: Payload, user: Staff) {
  const { docs } = await payload.find({ collection: 'users', where: { role: { equals: 'admin' } }, limit: 100, depth: 0, select: { disabled: true }, user, overrideAccess: false })
  return docs.filter((u) => !u.disabled).map((u) => u.id)
}

/** Nouveau membre : il se connecte ensuite avec cette adresse e-mail (Auth0), aucun mot de passe ici. */
export async function addMember(form: FormData): Promise<Result> {
  const ctx = await adminContext()
  if (!ctx) return fail('Réservé aux administrateurs.')
  const { payload, user } = ctx
  const name = text(form, 'name', 120)
  const email = text(form, 'email', 160).toLowerCase()
  const role = ROLES.find((r) => r === text(form, 'role'))
  if (!name) return fail('Indiquez le nom du membre.')
  if (!isEmail(email)) return fail('Indiquez une adresse e-mail valide.')
  if (!role) return fail('Choisissez un rôle.')

  const existing = await payload.count({ collection: 'users', where: { email: { equals: email } }, user, overrideAccess: false })
  if (existing.totalDocs) return fail('Cette adresse e-mail a déjà un accès. Modifiez le membre dans la liste.')

  try {
    await payload.create({ collection: 'users', data: { name, email, role, disabled: false }, depth: 0, user, overrideAccess: false })
  } catch (err) {
    return fail(errorMessage(err))
  }
  refresh()
  return { ok: true }
}

export async function setMemberRole(id: number, role: User['role']): Promise<Result> {
  const ctx = await adminContext()
  if (!ctx) return fail('Réservé aux administrateurs.')
  const { payload, user } = ctx
  if (!ROLES.includes(role)) return fail('Rôle inconnu.')
  if (id === user.id) return fail('Vous ne pouvez pas changer votre propre rôle. Demandez à un autre administrateur.')
  const member = await payload.findByID({ collection: 'users', id, depth: 0, user, overrideAccess: false }).catch(() => null)
  if (!member) return fail('Ce membre est introuvable.')
  if (member.role === role) return { ok: true }
  if (member.role === 'admin' && !member.disabled) {
    const admins = await activeAdmins(payload, user)
    if (admins.filter((a) => a !== id).length === 0) return fail('Il doit rester au moins un administrateur actif.')
  }
  try {
    await payload.update({ collection: 'users', id, data: { role }, depth: 0, user, overrideAccess: false })
  } catch (err) {
    return fail(errorMessage(err))
  }
  refresh()
  return { ok: true }
}

/** Couper ou rétablir l'accès : un accès coupé ne peut plus se connecter, ses dossiers restent. */
export async function setMemberAccess(id: number, disabled: boolean): Promise<Result> {
  const ctx = await adminContext()
  if (!ctx) return fail('Réservé aux administrateurs.')
  const { payload, user } = ctx
  if (disabled && id === user.id) return fail('Vous ne pouvez pas couper votre propre accès.')
  const member = await payload.findByID({ collection: 'users', id, depth: 0, user, overrideAccess: false }).catch(() => null)
  if (!member) return fail('Ce membre est introuvable.')
  if (Boolean(member.disabled) === disabled) return { ok: true }
  if (disabled && member.role === 'admin') {
    const admins = await activeAdmins(payload, user)
    if (admins.filter((a) => a !== id).length === 0) return fail('Il doit rester au moins un administrateur actif.')
  }
  try {
    await payload.update({ collection: 'users', id, data: { disabled }, depth: 0, user, overrideAccess: false })
  } catch (err) {
    return fail(errorMessage(err))
  }
  refresh()
  return { ok: true }
}
