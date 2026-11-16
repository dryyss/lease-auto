import type { Metadata } from 'next'

import { CardsSection } from '@/components/content/Blocks'
import { ContactForm } from '@/components/forms/SimpleForms'
import { AgencyMapCard, ContactDirectCard, HoursCard } from '@/components/contact/AgencyCards'
import { SectionHeader } from '@/components/home/Sections'
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
        <aside className="lg:sticky lg:top-24">
          <ContactDirectCard />
        </aside>
      </div>

      <section className="container-site pb-16">
        <SectionHeader eyebrow="Venir à l’agence" title="Passez nous voir à Épinay-sur-Seine" intro="Un conseiller vous reçoit pour essayer un véhicule ou monter votre dossier avec vous." />
        <div className="grid items-stretch gap-6 lg:grid-cols-[2fr_3fr]">
          <HoursCard />
          <AgencyMapCard />
        </div>
      </section>

      <CardsSection eyebrow="Nous écrire" title="Ce que nous pouvons faire pour vous" items={CONTACT.reasons} columns={4} soft />
    </>
  )
}
