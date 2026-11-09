import { FileCheck2, ShieldCheck, Timer } from 'lucide-react'
import type { Metadata } from 'next'

import { FinancingForm } from '@/components/forms/FinancingForm'
import { ContactAside } from '@/components/ui/ContactAside'
import { PageHero } from '@/components/ui/PageHero'
import { payloadClient, visibleVehiclesWhere } from '@/lib/payload'

export const metadata: Metadata = {
  title: 'Demande de financement LOA, LLD ou crédit',
  description: 'Faites votre demande de financement en 4 étapes et envoyez vos justificatifs en ligne. Réponse de principe sous 48 h ouvrées.',
  alternates: { canonical: '/demande' },
}

type Props = { searchParams: Promise<Record<string, string | undefined>> }

export default async function RequestPage({ searchParams }: Props) {
  const sp = await searchParams
  const payload = await payloadClient()
  const where = await visibleVehiclesWhere()
  const vehicles = await payload.find({
    collection: 'vehicles',
    where: { and: [...where.and, { status: { equals: 'available' } }] },
    sort: 'title',
    limit: 300,
    depth: 0,
    select: { title: true, price: true },
  })

  return (
    <>
      <PageHero compact
        eyebrow="Demande de financement"
        title="Votre financement en 4 étapes"
        intro="Quelques minutes suffisent. Un conseiller étudie votre dossier et vous répond sous 48 h ouvrées."
        crumbs={[{ label: 'Demande de financement' }]}
      />
      <div className="container-site grid items-start gap-8 pb-16 lg:grid-cols-[1fr_340px]">
        <div className="card p-6 sm:p-8">
          <FinancingForm
            vehicles={vehicles.docs.map((v) => ({ id: v.id, title: v.title, price: v.price }))}
            defaults={{ vehicle: sp.vehicule, formula: sp.formule, months: sp.duree, deposit: sp.apport }}
          />
        </div>
        <ContactAside>
          <div className="card space-y-4 p-6 text-sm">
            {[
              [Timer, 'Réponse sous 48 h', 'Accord de principe après réception du dossier complet.'],
              [FileCheck2, 'Dossier en ligne', 'Justificatifs déposés de façon sécurisée, supprimés après étude.'],
              [ShieldCheck, 'Sans engagement', 'La demande ne vous engage à rien.'],
            ].map(([Icon, title, text]) => {
              const I = Icon as typeof Timer
              return (
                <div key={title as string} className="flex gap-3">
                  <I className="size-5 shrink-0 text-accent" aria-hidden />
                  <div>
                    <p className="font-bold text-primary">{title as string}</p>
                    <p className="text-ink-2">{text as string}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </ContactAside>
      </div>
    </>
  )
}
