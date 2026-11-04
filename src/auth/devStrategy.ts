import type { AuthStrategy } from 'payload'

/** Comptes locaux, uniquement tant qu'Auth0 n'est pas configuré et hors production. */
export const DEV_ACCOUNTS = {
  'admin@lease-auto.test': { role: 'admin', name: 'Admin démo' },
  'commercial@lease-auto.test': { role: 'commercial', name: 'Commercial démo' },
} as const

export type DevEmail = keyof typeof DEV_ACCOUNTS

export const DEV_COOKIE = 'lease-dev-user'

export function devAuthAllowed() {
  if (process.env.NODE_ENV === 'production') return false
  if (process.env.VERCEL_ENV) return false
  return !(process.env.AUTH0_DOMAIN && process.env.AUTH0_CLIENT_ID && process.env.AUTH0_CLIENT_SECRET)
}

export const devStrategy: AuthStrategy = {
  name: 'dev',
  authenticate: async ({ headers, payload }) => {
    if (!devAuthAllowed()) return { user: null }
    const raw = headers.get('cookie') ?? ''
    const email = decodeURIComponent(raw.match(new RegExp(`(?:^|;\\s*)${DEV_COOKIE}=([^;]+)`))?.[1] ?? '')
    if (!(email in DEV_ACCOUNTS)) return { user: null }
    const { docs } = await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const user = docs[0]
    if (!user || user.disabled || user.role !== DEV_ACCOUNTS[email as DevEmail].role) return { user: null }
    return { user: { ...user, collection: 'users', _strategy: 'dev' } }
  },
}
