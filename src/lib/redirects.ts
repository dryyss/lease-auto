import { notFound, permanentRedirect } from 'next/navigation'

import { payloadClient } from './payload'

const COLLECTION_PATHS: Record<string, string> = {
  vehicles: '/vehicule/',
  articles: '/guides/',
  'local-pages': '/voiture-occasion/',
}

/**
 * SEO-06 : avant d'afficher une 404, cherche l'adresse dans les redirections saisies
 * dans l'administration (anciennes URL du site) et redirige en 301.
 */
export async function redirectOrNotFound(path: string): Promise<never> {
  const payload = await payloadClient()
  const candidates = [path, path.replace(/\/$/, ''), `${path.replace(/\/$/, '')}/`]
  const { docs } = await payload.find({ collection: 'redirects', where: { from: { in: candidates } }, limit: 1, depth: 1 })
  const r = docs[0]
  if (r?.to) {
    if (r.to.type === 'custom' && r.to.url) permanentRedirect(r.to.url)
    const ref = r.to.reference
    if (ref && typeof ref.value === 'object' && 'slug' in ref.value && ref.value.slug) {
      permanentRedirect(`${COLLECTION_PATHS[ref.relationTo] ?? '/'}${ref.value.slug}`)
    }
  }
  notFound()
}
