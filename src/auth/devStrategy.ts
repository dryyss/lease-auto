import type { AuthStrategy } from 'payload'

/**
 * Comptes de démonstration, sans Auth0 :
 * - en local, tant qu'Auth0 n'est pas configuré ;
 * - en ligne, seulement si DEMO_ACCESS_CODE est défini (lien /dev/acces?code=…). Retirer la variable coupe l'accès.
 */
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

const demoCode = () => {
  const code = process.env.DEMO_ACCESS_CODE ?? ''
  return code.length >= 12 ? code : ''
}

/** Accès démo en ligne : le code doit accompagner le lien. */
export const demoCodeValid = (code: unknown) => Boolean(demoCode()) && code === demoCode()

export const demoAccessAllowed = () => devAuthAllowed() || Boolean(demoCode())

// Le cookie porte l'e-mail signé : impossible de se fabriquer un accès en écrivant le cookie soi-même.
async function signature(email: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(`${process.env.PAYLOAD_SECRET ?? ''}:${demoCode()}`),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(email))
  return Buffer.from(sig).toString('base64url')
}

export const devCookieValue = async (email: DevEmail) => `${email}|${await signature(email)}`

async function emailFromCookie(raw: string) {
  const [email, sig] = raw.split('|')
  if (!email || !(email in DEV_ACCOUNTS) || !sig) return undefined
  return sig === (await signature(email)) ? (email as DevEmail) : undefined
}

export const devStrategy: AuthStrategy = {
  name: 'dev',
  authenticate: async ({ headers, payload }) => {
    if (!demoAccessAllowed()) return { user: null }
    const raw = headers.get('cookie') ?? ''
    const email = await emailFromCookie(decodeURIComponent(raw.match(new RegExp(`(?:^|;\\s*)${DEV_COOKIE}=([^;]+)`))?.[1] ?? ''))
    if (!email) return { user: null }
    const { docs } = await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const user = docs[0]
    if (!user || user.disabled || user.role !== DEV_ACCOUNTS[email].role) return { user: null }
    return { user: { ...user, collection: 'users', _strategy: 'dev' } }
  },
}
