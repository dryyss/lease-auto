import { Phone } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { CardsSection, FormulaCompare, ProseSection, QuestionsSection } from '@/components/content/Blocks'
import { QuickSimulator } from '@/components/home/QuickSimulator'
import { CreditNotice } from '@/components/ui/CreditNotice'
import { PageHero } from '@/components/ui/PageHero'
import { telHref } from '@/lib/format'
import { getSettings } from '@/lib/payload'
import { SIMULATOR } from '@/lib/page-content'
import { getFormulaRates } from '@/lib/rates'

export const metadata: Metadata = {
  title: 'Simulateur de mensualité LOA, LLD et crédit auto',
  description: 'Calculez en direct votre mensualité en LOA, LLD ou crédit auto selon le prix, l’apport et la durée. TAEG et coût total affichés.',
  alternates: { canonical: '/simulateur' },
}

export const revalidate = 3600

/** PUB-10 : simulateur complet avec TAEG, coût total et mentions légales. */
export default async function SimulatorPage() {
  const [rates, settings] = await Promise.all([getFormulaRates(), getSettings()])
  const phone = settings.company?.phone
  return (
    <>
      <PageHero
        eyebrow="Simulateur"
        title="Calculez votre mensualité"
        intro="Choisissez la formule, le prix, l’apport et la durée : la mensualité, le TAEG et le coût total s’affichent. Simulation sans engagement."
        crumbs={[{ label: 'Simulateur' }]}
      />
      <div className="container-site max-w-6xl pb-16">
        {rates.length ? <QuickSimulator rates={rates} /> : (
          // Sans taux publiés (Réglages > Financement), on propose une simulation faite par un conseiller.
          <div className="card p-8 text-center">
            <p className="mb-2 text-xl font-black text-primary">Simulation personnalisée</p>
            <p className="mx-auto mb-6 max-w-xl text-ink-2">
              Nos taux dépendent de votre profil et de nos partenaires financiers. Indiquez le véhicule et votre budget : un conseiller vous envoie une simulation chiffrée.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/demande" className="btn-primary">Demander ma simulation</Link>
              {phone && (
                <a href={telHref(phone)} className="btn-ghost">
                  <Phone className="size-4" aria-hidden /> {phone}
                </a>
              )}
            </div>
          </div>
        )}
        <CreditNotice className="mt-10 border-t border-line pt-6" />
      </div>

      <CardsSection eyebrow="Bien lire" title="Comprendre votre simulation" items={SIMULATOR.read} columns={4} soft />
      <ProseSection eyebrow="Nos conseils" title="Payer moins cher son financement" paragraphs={SIMULATOR.tips} />
      <FormulaCompare soft />
      <QuestionsSection title="Vos questions sur la simulation" items={SIMULATOR.faq} />
    </>
  )
}
