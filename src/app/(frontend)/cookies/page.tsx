import type { Metadata } from 'next'

import { CookieSettingsButton } from '@/components/layout/CookieBanner'
import { PageHero } from '@/components/ui/PageHero'

export const metadata: Metadata = {
  title: 'Gestion des cookies',
  description: 'Cookies utilisés sur le site Lease Auto, mesure d’audience soumise à votre accord et modification de votre choix à tout moment.',
  alternates: { canonical: '/cookies' },
}

/** CONF-02 : explication des cookies et modification du choix à tout moment. */
export default function CookiesPage() {
  return (
    <>
      <PageHero eyebrow="Informations légales" title="Gestion des cookies" crumbs={[{ label: 'Cookies' }]} />
      <div className="container-site max-w-3xl space-y-4 pb-16 text-[15px] leading-relaxed text-ink-2">
        <p>
          <strong className="text-primary">Cookies nécessaires</strong> : ils font fonctionner le site (sécurité, mémorisation de votre choix de cookies, favoris). Ils ne
          demandent pas votre accord.
        </p>
        <p>
          <strong className="text-primary">Mesure d’audience</strong> : avec votre accord, nous mesurons la fréquentation du site pour l’améliorer. Ces cookies sont conservés
          13 mois au maximum.
        </p>
        <p>Vous pouvez changer d’avis à tout moment :</p>
        <CookieSettingsButton />
      </div>
    </>
  )
}
