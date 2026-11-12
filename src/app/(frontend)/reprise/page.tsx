import type { Metadata } from 'next'

import { CardsSection, QuestionsSection } from '@/components/content/Blocks'
import { TradeInForm } from '@/components/forms/SimpleForms'
import { ContactAside } from '@/components/ui/ContactAside'
import { PageHero } from '@/components/ui/PageHero'
import { uploadsEnabled } from '@/lib/services'
import { TRADE_IN } from '@/lib/page-content'

export const metadata: Metadata = {
  title: 'Reprise de votre véhicule : estimation gratuite',
  description: 'Décrivez votre véhicule actuel et ajoutez des photos : Lease Auto vous propose une estimation de reprise sous 48 h, déductible de votre prochain achat.',
  alternates: { canonical: '/reprise' },
}

/** PUB-13 : estimation de reprise. */
export default function TradeInPage() {
  return (
    <>
      <PageHero compact
        eyebrow="Reprise"
        title="Estimez la reprise de votre véhicule"
        intro="Décrivez votre véhicule actuel, ajoutez quelques photos : nous vous envoyons une estimation sous 48 h. Le montant peut servir d’apport pour votre prochain véhicule."
        crumbs={[{ label: 'Reprise' }]}
      />
      <div className="container-site grid items-start gap-8 pb-16 lg:grid-cols-[1fr_340px]">
        <div className="card p-6 sm:p-8">
          <TradeInForm uploads={uploadsEnabled()} />
        </div>
        <ContactAside />
      </div>

      <CardsSection eyebrow="Comment ça marche" title="Votre reprise en 4 étapes" items={TRADE_IN.steps} numbered columns={4} soft />
      <CardsSection eyebrow="L’estimation" title="Ce qui fait la valeur de votre véhicule" intro="Nous estimons votre véhicule au prix du marché, avec les mêmes critères qu’un professionnel de la revente." items={TRADE_IN.value} />
      <CardsSection eyebrow="À préparer" title="Les documents utiles" items={TRADE_IN.documents} columns={4} soft />
      <QuestionsSection title="Vos questions sur la reprise" items={TRADE_IN.faq} />
    </>
  )
}
