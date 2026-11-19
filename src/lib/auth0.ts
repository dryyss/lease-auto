import { Auth0Client } from '@auth0/nextjs-auth0/server'

// Sans configuration Auth0, le site tourne normalement et l'administration est simplement inaccessible.
const configured = Boolean(process.env.AUTH0_DOMAIN && process.env.AUTH0_CLIENT_ID && process.env.AUTH0_CLIENT_SECRET)

/** Domaine définitif : la connexion y fonctionne dès qu'il pointe sur Vercel, sans toucher au code ni aux variables. */
const FINAL_DOMAINS = ['https://www.lease-auto.fr', 'https://lease-auto.fr']

/**
 * Adresses où la connexion de l'équipe est acceptée : APP_BASE_URL (une ou plusieurs, séparées par des virgules),
 * l'adresse publique du site, le domaine de production Vercel et, en production, le domaine définitif.
 * Le SDK retient l'adresse de la requête si elle figure dans cette liste (retour Auth0 et déconnexion sur le bon domaine).
 * Chaque adresse doit aussi être déclarée dans Auth0 (Allowed Callback / Logout URLs / Web Origins).
 */
export const authBaseUrls = [
  ...new Set(
    [
      ...(process.env.APP_BASE_URL ?? '').split(','),
      process.env.NEXT_PUBLIC_SERVER_URL ?? '',
      ...(process.env.NODE_ENV === 'production'
        ? [process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '', ...FINAL_DOMAINS]
        : []),
    ]
      .map((u) => u.trim().replace(/\/+$/, ''))
      .filter((u) => /^https?:\/\/[^/]+$/.test(u)),
  ),
]

// Lit AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET et AUTH0_SECRET.
// Routes montées par le middleware : /auth/login, /auth/logout, /auth/callback.
export const auth0 = configured
  ? new Auth0Client({
      appBaseUrl: authBaseUrls.length > 1 ? authBaseUrls : authBaseUrls[0],
      signInReturnToPath: '/gestion',
      authorizationParameters: { scope: 'openid profile email' },
    })
  : null
