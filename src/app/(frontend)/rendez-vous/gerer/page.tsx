import { CalendarDays, CarFront, MapPin } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { ContactAside } from '@/components/ui/ContactAside'
import { PageHero } from '@/components/ui/PageHero'
import { availableSlots } from '@/lib/agenda'
import { appointmentTokenValid } from '@/lib/appointment-link'
import { payloadClient } from '@/lib/payload'

import { ManageAppointment } from './ManageAppointment'

export const metadata: Metadata = { title: 'Gérer mon rendez-vous', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

const KINDS = { 'test-drive': 'Essai d’un véhicule', visit: 'Passage à l’agence', delivery: 'Livraison' } as const
const when = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })

type Props = { searchParams: Promise<{ id?: string; t?: string }> }

/** Lien « Annuler ou changer de créneau » des e-mails de rendez-vous : le client gère son rendez-vous sans compte. */
export default async function ManageAppointmentPage({ searchParams }: Props) {
  const { id, t } = await searchParams
  const payload = await payloadClient()
  const a = id ? await payload.findByID({ collection: 'appointments', id: Number(id), depth: 1, overrideAccess: true }).catch(() => null) : null
  const valid = !!a && appointmentTokenValid(a, t)
  const upcoming = valid && a.status === 'confirmed' && new Date(a.startsAt).getTime() > Date.now()
  const [slots, settings] = await Promise.all([upcoming ? availableSlots(payload) : [], payload.findGlobal({ slug: 'settings', depth: 0 })])
  const c = settings.company

  let body
  if (!valid) {
    body = (
      <>
        <p className="mb-2 text-xl font-black text-primary">Lien non valide</p>
        <p className="mb-6 text-ink-2">Ce lien est incomplet ou a été modifié. Ouvrez de nouveau le lien reçu par e-mail, ou appelez-nous.</p>
        <Link href="/rendez-vous" className="btn-primary">
          Prendre rendez-vous
        </Link>
      </>
    )
  } else {
    const vehicle = a.vehicle && typeof a.vehicle === 'object' ? a.vehicle : null
    body = (
      <>
        <p className="mb-4 text-xl font-black text-primary">Bonjour {a.name}</p>
        <ul className="mb-6 space-y-2.5 rounded-2xl bg-soft p-5 text-sm">
          <li className="flex items-start gap-2.5">
            <CalendarDays className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
            <span>
              <strong className="text-primary first-letter:uppercase">{when(a.startsAt)}</strong> · {KINDS[a.kind]}
            </span>
          </li>
          {vehicle && (
            <li className="flex items-start gap-2.5">
              <CarFront className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
              <Link href={`/vehicule/${vehicle.slug}`} className="font-semibold text-primary hover:text-accent">
                {vehicle.title}
              </Link>
            </li>
          )}
          {c?.address && (
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
              <span>{[c.address, c.postalCode, c.city].filter(Boolean).join(' ')}</span>
            </li>
          )}
        </ul>
        {upcoming ? (
          <ManageAppointment id={a.id} token={t!} slots={slots} />
        ) : (
          <>
            <p className="mb-6 text-ink-2">{a.status === 'cancelled' ? 'Ce rendez-vous est annulé.' : 'Ce rendez-vous est passé.'} Vous pouvez en prendre un nouveau à tout moment.</p>
            <Link href="/rendez-vous" className="btn-primary">
              Prendre un nouveau rendez-vous
            </Link>
          </>
        )}
      </>
    )
  }

  return (
    <>
      <PageHero compact eyebrow="Rendez-vous" title="Gérer mon rendez-vous" intro="Changez de créneau ou annulez en un clic." crumbs={[{ label: 'Rendez-vous', href: '/rendez-vous' }, { label: 'Gérer' }]} />
      <div className="container-site grid items-start gap-8 pb-16 lg:grid-cols-[1fr_340px]">
        <div className="card p-6 sm:p-8">{body}</div>
        <ContactAside />
      </div>
    </>
  )
}
