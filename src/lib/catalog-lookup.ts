import { cache } from 'react'

import { payloadClient } from './payload'

export const findBrand = cache(async (slug: string) => {
  const payload = await payloadClient()
  const { docs } = await payload.find({ collection: 'brands', where: { slug: { equals: slug } }, limit: 1, depth: 1 })
  return docs[0] ?? null
})

export const findModel = cache(async (brandId: number, slug: string) => {
  const payload = await payloadClient()
  const { docs } = await payload.find({
    collection: 'models',
    where: { and: [{ brand: { equals: brandId } }, { slug: { equals: slug } }] },
    limit: 1,
    depth: 1,
  })
  return docs[0] ?? null
})

/** Titre, description et image de partage saisis dans l'onglet SEO (SEO-04), avec repli. */
export const seoMeta = (
  doc: { meta?: { title?: string | null; description?: string | null; image?: unknown } | null } | null | undefined,
  fallback: { title: string; description: string },
) => {
  const image = doc?.meta?.image && typeof doc.meta.image === 'object' ? (doc.meta.image as { url?: string | null }).url : undefined
  return {
    title: doc?.meta?.title || fallback.title,
    description: doc?.meta?.description || fallback.description,
    ...(image && { openGraph: { images: [image.replace(/^https?:\/\/[^/]+/, '')] } }),
  }
}
