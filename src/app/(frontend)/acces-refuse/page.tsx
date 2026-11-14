import type { Metadata } from 'next'

import { auth0 } from '@/lib/auth0'

export const metadata: Metadata = { title: 'Accès refusé', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function AccessDenied() {
  const session = await auth0?.getSession().catch(() => null)
  const email = session?.user.email
  const unverified = session?.user.email_verified === false

  return (
    <section className="container-site max-w-xl! pt-36 pb-20">
      <h1 className="mb-4 text-3xl font-black text-primary">Accès refusé</h1>
      {email && (
        <p className="mb-3 text-ink-2">
          Vous êtes connecté avec <strong className="text-primary">{email}</strong>.
        </p>
      )}
      <p className="mb-6 text-ink-2">
        {unverified
          ? 'Cette adresse e-mail n’est pas encore confirmée : ouvrez le lien reçu par e-mail, puis reconnectez-vous.'
          : 'Ce compte n’a pas accès à l’administration de Lease Auto. Demandez à un administrateur de vous ajouter avec exactement cette adresse e-mail.'}
      </p>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- /auth/logout est une route middleware, pas une page Next */}
      <a href="/auth/logout" className="btn-dark">
        Se déconnecter et changer de compte
      </a>
    </section>
  )
}
