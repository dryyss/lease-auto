import type { MetadataRoute } from 'next'

import { indexable } from '@/lib/indexing'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  // Préproduction ou adresse *.vercel.app : rien n'est indexé, seul le vrai domaine l'est.
  if (!indexable) {
    return { rules: { userAgent: '*', disallow: '/' } }
  }
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/favoris', '/desinscription', '/acces-refuse', '/dev'] },
    sitemap: `${base}/sitemap.xml`,
  }
}
