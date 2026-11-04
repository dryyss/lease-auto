import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { DEV_ACCOUNTS, devAuthAllowed } from '@/auth/devStrategy'

import { enterAs } from './actions'

export const metadata: Metadata = { title: 'Accès de démonstration', robots: { index: false, follow: false } }

export default function DevAccessPage() {
  if (!devAuthAllowed()) notFound()
  const accounts = Object.entries(DEV_ACCOUNTS) as [keyof typeof DEV_ACCOUNTS, (typeof DEV_ACCOUNTS)[keyof typeof DEV_ACCOUNTS]][]

  return (
    <section className="container-site max-w-3xl pt-32 pb-20">
      <p className="eyebrow mb-3">Développement</p>
      <h1 className="text-3xl font-black text-primary sm:text-4xl">Voir les tableaux de bord</h1>
      <p className="mt-4 text-ink-2">
        Deux accès locaux, sans Auth0. Ils disparaissent dès que la connexion Auth0 est configurée, et ils n’existent pas en production.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {accounts.map(([email, account]) => (
          <form key={email} action={enterAs.bind(null, email)} className="card flex flex-col p-6">
            <p className="eyebrow mb-2">{account.role === 'admin' ? 'Administrateur' : 'Commercial'}</p>
            <h2 className="text-xl font-black text-primary">{account.name}</h2>
            <p className="mt-2 mb-6 text-sm text-ink-2">
              {account.role === 'admin'
                ? 'Tout le site : stock, demandes, contenus, réglages et utilisateurs.'
                : 'Stock, demandes, rendez-vous et contenus. Pas les réglages ni les utilisateurs.'}
            </p>
            <button type="submit" className="btn-primary mt-auto">
              Ouvrir ce tableau de bord
            </button>
          </form>
        ))}
      </div>
    </section>
  )
}
