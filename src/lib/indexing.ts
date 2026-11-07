/**
 * Indexation Google autorisée seulement sur le vrai domaine. Sur une adresse *.vercel.app (préproduction,
 * avant la bascule de lease-auto.fr), le site ferait doublon avec l'ancien site : rien n'est indexé.
 */
export const indexable = (() => {
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') return false
  const url = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
  return !/\.vercel\.app/.test(url)
})()
