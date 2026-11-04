import { Auth0Client } from '@auth0/nextjs-auth0/server'

// Permet de lancer le site en local sans Auth0 (l'admin est alors simplement inaccessible).
export const auth0Configured = Boolean(
  process.env.AUTH0_DOMAIN && process.env.AUTH0_CLIENT_ID && process.env.AUTH0_CLIENT_SECRET,
)

// Lit AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_SECRET et APP_BASE_URL.
// Routes montées par le middleware : /auth/login, /auth/logout, /auth/callback.
export const auth0 = new Auth0Client({
  signInReturnToPath: '/admin',
  authorizationParameters: { scope: 'openid profile email' },
})
