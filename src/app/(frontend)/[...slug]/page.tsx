import { redirectOrNotFound } from '@/lib/redirects'

/**
 * SEO-06 : toute adresse inconnue (anciennes URL du site) passe ici. Si une redirection existe
 * dans l'administration (Réglages → Redirections), on redirige en 301, sinon page 404.
 */
export default async function CatchAll({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  return redirectOrNotFound(`/${slug.map(decodeURIComponent).join('/')}`)
}
