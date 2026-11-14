import type { Metadata } from 'next'

import { CardsSection } from '@/components/content/Blocks'
import { ContactForm } from '@/components/forms/SimpleForms'
import { ContactAside } from '@/components/ui/ContactAside'
import { PageHero } from '@/components/ui/PageHero'
import { CONTACT } from '@/lib/page-content'

export const metadata: Metadata = {
  title: 'Contacter Lease Auto à Épinay-sur-Seine',
  description: 'Contactez Lease Auto à Épinay-sur-Seine (93) : téléphone, WhatsApp, e-mail ou rappel gratuit par un conseiller pour votre projet de voiture d’occasion financée.',
  alternates: { canonical: '/contact' },
}

type Props = { searchParams: Promise<{ rappel?: string }> }

export default async function ContactPage({ searchParams }: Props) {
  const { rappel } = await searchParams
  return (
    <>
      <PageHero compact eyebrow="Contact" title="Parlons de votre projet" intro="Écrivez-nous ou demandez à être rappelé : un conseiller vous répond." crumbs={[{ label: 'Contact' }]} />
      <div className="container-site grid items-start gap-8 pb-16 lg:grid-cols-[1fr_340px]">
        <div className="card p-6 sm:p-8">
          <ContactForm callback={rappel === '1'} />
        </div>
        <ContactAside />
      </div>

      <CardsSection eyebrow="Nous écrire" title="Ce que nous pouvons faire pour vous" items={CONTACT.reasons} columns={4} soft />
    </>
  )
}
