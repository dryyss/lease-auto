import config from '@payload-config'
import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'

import { FORMULAS } from '@/lib/formulas-content'

export const revalidate = 3600
// Ne pas pré-rendre au build : Payload exige PAYLOAD_SECRET, absent tant que la variable
// n'est pas exposée au build Vercel. Le fichier est produit à la première visite.
export const dynamic = 'force-dynamic'

/** SEO-06 : plan du site généré automatiquement (pages, véhicules en ligne, marques, modèles, guides, pages locales). */
const staticEntries = (base: string): MetadataRoute.Sitemap => {
  const statics = ['', '/vehicules', '/simulateur', '/demande', '/reprise', '/rendez-vous', '/agence', '/contact', '/faq', '/guides', '/mentions-legales', '/confidentialite', '/conditions-generales', '/cookies']
  return [
    ...statics.map((p) => ({ url: `${base}${p}`, changeFrequency: p === '' || p === '/vehicules' ? ('daily' as const) : ('monthly' as const), priority: p === '' ? 1 : 0.6 })),
    ...Object.keys(FORMULAS).map((f) => ({ url: `${base}/financement/${f}`, changeFrequency: 'monthly' as const, priority: 0.8 })),
  ]
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const pages = staticEntries(base)
  if (!process.env.PAYLOAD_SECRET || !process.env.DATABASE_URL) return pages

  try {
    const payload = await getPayload({ config })
    const published = { _status: { equals: 'published' } } as const
    const [vehicles, brands, models, articles, locals] = await Promise.all([
      payload.find({ collection: 'vehicles', where: { and: [published, { status: { not_equals: 'sold' } }] }, limit: 2000, depth: 0, select: { slug: true, updatedAt: true } }),
      payload.find({ collection: 'brands', limit: 500, depth: 0, select: { slug: true, updatedAt: true } }),
      payload.find({ collection: 'models', limit: 2000, depth: 1, select: { slug: true, brand: true, updatedAt: true } }),
      payload.find({ collection: 'articles', where: published, limit: 1000, depth: 0, select: { slug: true, updatedAt: true } }),
      payload.find({ collection: 'local-pages', where: published, limit: 100, depth: 0, select: { slug: true, updatedAt: true } }),
    ])
    return [
      ...pages,
      ...vehicles.docs.map((v) => ({ url: `${base}/vehicule/${v.slug}`, lastModified: v.updatedAt, changeFrequency: 'weekly' as const, priority: 0.9 })),
      ...brands.docs.map((b) => ({ url: `${base}/vehicules/${b.slug}`, lastModified: b.updatedAt, changeFrequency: 'daily' as const, priority: 0.7 })),
      ...models.docs.flatMap((m) =>
        typeof m.brand === 'object' && m.brand ? [{ url: `${base}/vehicules/${m.brand.slug}/${m.slug}`, lastModified: m.updatedAt, changeFrequency: 'daily' as const, priority: 0.6 }] : [],
      ),
      ...articles.docs.map((a) => ({ url: `${base}/guides/${a.slug}`, lastModified: a.updatedAt, priority: 0.5 })),
      ...locals.docs.map((l) => ({ url: `${base}/voiture-occasion/${l.slug}`, lastModified: l.updatedAt, priority: 0.7 })),
    ]
  } catch {
    return pages
  }
}
