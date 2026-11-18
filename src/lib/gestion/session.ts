import 'server-only'

import config from '@payload-config'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload, type Payload } from 'payload'
import { cache } from 'react'

import { auth0 } from '@/lib/auth0'
import type { User } from '@/payload-types'

export type Staff = User & { role: 'admin' | 'commercial' }

/**
 * Console « Gestion » : utilisateur de l'équipe connecté (Auth0 ou accès démo), sinon redirection.
 * Les droits restent ceux de Payload : chaque lecture et écriture passe `user` avec overrideAccess: false.
 */
export const requireStaff = cache(async (): Promise<{ payload: Payload; user: Staff }> => {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (user && 'role' in user && (user.role === 'admin' || user.role === 'commercial') && !user.disabled) {
    return { payload, user: user as Staff }
  }
  if (!auth0) redirect('/dev/acces')
  // Connecté chez Auth0 mais inconnu de Payload : on l'arrête, sinon Auth0 le renverrait ici en boucle.
  if (await auth0.getSession()) redirect('/acces-refuse')
  redirect('/auth/login?returnTo=/gestion')
})

export const isAdminUser = (u: Staff) => u.role === 'admin'
