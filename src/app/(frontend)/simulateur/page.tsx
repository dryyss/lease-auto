import type { Metadata } from 'next'

import { QuickSimulator } from '@/components/home/QuickSimulator'
import { CreditNotice } from '@/components/ui/CreditNotice'
import { PageHero } from '@/components/ui/PageHero'
import { getFormulaRates } from '@/lib/rates'

export const metadata: Metadata = {
  title: 'Simulateur de mensualité LOA, LLD et crédit auto',
  description: 'Calculez en direct votre mensualité en LOA, LLD ou crédit auto selon le prix, l’apport et la durée. TAEG et coût total affichés.',
  alternates: { canonical: '/simulateur' },
}

export const revalidate = 3600

/** PUB-10 : simulateur complet avec TAEG, coût total et mentions légales. */
export default async function SimulatorPage() {
  const rates = await getFormulaRates()
  return (
    <>
      <PageHero
        eyebrow="Simulateur"
        title="Calculez votre mensualité"
        intro="Choisissez la formule, le prix, l’apport et la durée : la mensualité, le TAEG et le coût total s’affichent instantanément. Sans engagement."
        crumbs={[{ label: 'Simulateur' }]}
      />
      <div className="container-site max-w-6xl pb-16">
        {rates.length ? <QuickSimulator rates={rates} /> : <p className="card p-6">Les taux ne sont pas encore renseignés dans les Réglages.</p>}
        <CreditNotice className="mt-10 border-t border-line pt-6" />
      </div>
    </>
  )
}
