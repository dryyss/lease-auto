import type { Metadata } from 'next'

import { AgendaForm } from '@/components/gestion/creneaux/AgendaForm'
import { toInput } from '@/components/gestion/creneaux/shared'
import { PageHeader } from '@/components/gestion/ui'
import { availableSlots, type DaySlots } from '@/lib/agenda'
import { ago } from '@/lib/gestion/labels'
import { requireStaff } from '@/lib/gestion/session'

export const metadata: Metadata = { title: 'Créneaux de rendez-vous' }

export default async function CreneauxPage() {
  const { payload, user } = await requireStaff()
  const doc = await payload.findGlobal({ slug: 'agenda', depth: 0, user, overrideAccess: false })
  // Aperçu : le même calcul que la page de réservation du site (rendez-vous déjà pris déduits).
  const preview: DaySlots[] | null = await availableSlots(payload, 14).catch((err) => {
    payload.logger.warn({ err }, 'Aperçu des créneaux indisponible')
    return null
  })

  return (
    <>
      <PageHeader
        title="Créneaux de rendez-vous"
        subtitle={`Les plages pendant lesquelles les clients peuvent réserver un essai ou un passage en ligne.${doc.updatedAt ? ` Modifiés ${ago(doc.updatedAt)}.` : ''}`}
      />
      <AgendaForm initial={toInput(doc)} preview={preview} />
    </>
  )
}
