import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  // Préproduction Vercel : rien n'est indexé, seule la production l'est.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    return { rules: { userAgent: '*', disallow: '/' } }
  }
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/favoris', '/desinscription', '/acces-refuse'] },
    sitemap: `${base}/sitemap.xml`,
  }
}
