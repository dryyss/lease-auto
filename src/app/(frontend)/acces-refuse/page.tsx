import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Accès refusé', robots: { index: false } }

export default function AccessDenied() {
  return (
    <section style={{ padding: '4rem 1rem', maxWidth: 560, margin: '0 auto' }}>
      <h1>Accès refusé</h1>
      <p>
        Votre compte n’a pas accès à l’administration de Lease Auto. Demandez à un administrateur de vous
        ajouter avec la même adresse e-mail.
      </p>
      <p>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- /auth/logout est une route middleware, pas une page Next */}
        <a href="/auth/logout">Se déconnecter et changer de compte</a>
      </p>
    </section>
  )
}
