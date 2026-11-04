import { NextRequest } from 'next/server'
import type { AuthStrategy } from 'payload'

import { auth0, auth0Configured } from '@/lib/auth0'

/**
 * Connexion à l'administration via Auth0.
 *
 * Auth0 ne fait que l'identité (connexion, mot de passe oublié, double authentification).
 * Le rôle (admin / commercial) vit uniquement dans la collection Users de Payload :
 * une seule source de vérité. Un e-mail inconnu de Payload n'a aucun accès, même connecté à Auth0.
 */
export const auth0Strategy: AuthStrategy = {
  name: 'auth0',
  authenticate: async ({ headers, payload }) => {
    if (!auth0Configured || !headers.get('cookie')) return { user: null }

    const session = await auth0.getSession(
      new NextRequest(process.env.APP_BASE_URL || 'http://localhost:3000', { headers }),
    )
    if (!session) return { user: null }
    const email = session.user.email?.toLowerCase()
    if (!email || session.user.email_verified === false) return { user: null }

    const { docs } = await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const user = docs[0]
    if (!user || user.disabled) return { user: null }

    return { user: { ...user, collection: 'users', _strategy: 'auth0' } }
  },
}
