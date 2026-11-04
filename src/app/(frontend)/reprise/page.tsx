import type { Metadata } from 'next'

import { TradeInForm } from '@/components/forms/SimpleForms'
import { ContactAside } from '@/components/ui/ContactAside'
import { PageHero } from '@/components/ui/PageHero'

export const metadata: Metadata = {
  title: 'Reprise de votre véhicule : estimation gratuite',
  description: 'Décrivez votre véhicule actuel et ajoutez des photos : Lease Auto vous propose une estimation de reprise sous 48 h, déductible de votre prochain achat.',
  alternates: { canonical: '/reprise' },
}

/** PUB-13 : estimation de reprise. */
export default function TradeInPage() {
  return (
    <>
      <PageHero
        eyebrow="Reprise"
        title="Estimez la reprise de votre véhicule"
        intro="Décrivez votre véhicule actuel, ajoutez quelques photos : nous vous envoyons une estimation sous 48 h. Le montant peut servir d’apport pour votre prochain véhicule."
        crumbs={[{ label: 'Reprise' }]}
      />
      <div className="container-site grid gap-8 pb-16 lg:grid-cols-[1fr_340px]">
        <div className="card p-6 sm:p-8">
          <TradeInForm />
        </div>
        <ContactAside />
      </div>
    </>
  )
}
