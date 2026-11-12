import type { Metadata } from 'next'

import { CardsSection, QuestionsSection } from '@/components/content/Blocks'
import { AppointmentForm } from '@/components/forms/SimpleForms'
import { ContactAside } from '@/components/ui/ContactAside'
import { PageHero } from '@/components/ui/PageHero'
import { emailEnabled } from '@/lib/services'
import { availableSlots } from '@/lib/agenda'
import { APPOINTMENT } from '@/lib/page-content'
import { payloadClient } from '@/lib/payload'

export const metadata: Metadata = {
  title: 'Prendre rendez-vous : essai ou passage en agence',
  description: 'Réservez un essai ou un passage dans notre agence d’Épinay-sur-Seine en choisissant votre créneau en ligne.',
  alternates: { canonical: '/rendez-vous' },
}

// Les créneaux dépendent des réservations en cours : toujours calculés à la demande.
export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<{ vehicule?: string }> }

/** PUB-14 : prise de rendez-vous sur les créneaux définis dans l'administration. */
export default async function AppointmentPage({ searchParams }: Props) {
  const { vehicule } = await searchParams
  const payload = await payloadClient()
  const [slots, vehicle] = await Promise.all([
    availableSlots(payload),
    vehicule ? payload.findByID({ collection: 'vehicles', id: Number(vehicule), depth: 0, overrideAccess: false }).catch(() => null) : null,
  ])

  return (
    <>
      <PageHero compact
        eyebrow="Rendez-vous"
        title="Essayez votre future voiture"
        intro={`Choisissez un créneau pour un essai ou un passage à l’agence.${emailEnabled() ? ' Vous recevez une confirmation par e-mail et un rappel la veille.' : ''}`}
        crumbs={[{ label: 'Rendez-vous' }]}
      />
      <div className="container-site grid items-start gap-8 pb-16 lg:grid-cols-[1fr_340px]">
        <div className="card overflow-hidden p-6 sm:p-8">
          <AppointmentForm slots={slots} vehicleId={vehicle?.id} vehicleTitle={vehicle?.title} />
        </div>
        <ContactAside />
      </div>

      <CardsSection eyebrow="Avant de venir" title="Pour un rendez-vous utile" items={APPOINTMENT.prepare} columns={4} soft />
      <QuestionsSection title="Vos questions sur le rendez-vous" items={APPOINTMENT.faq} />
    </>
  )
}
