import { CalendarDays, CarFront, FolderOpen, Search } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { Badge, Card, Empty, PageHeader } from '@/components/gestion/ui'
import { APPOINTMENT_KINDS, euro, fmtDate, fmtDateTime, REQUEST_STATUS_TONE, REQUEST_TYPES, requestStatusLabel, VEHICLE_STATUS, VEHICLE_STATUS_TONE } from '@/lib/gestion/labels'
import { requireStaff } from '@/lib/gestion/session'

export const metadata: Metadata = { title: 'Recherche' }

/** Recherche de la barre du haut : demandes, véhicules et rendez-vous en une fois. */
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { payload, user } = await requireStaff()
  const q = String((await searchParams).q ?? '').trim().slice(0, 80)
  const opts = { user, overrideAccess: false as const, depth: 1, limit: 20 }

  if (!q) {
    return (
      <>
        <PageHeader title="Recherche" />
        <Card>
          <Empty icon={Search} title="Que cherchez-vous ?" text="Nom, téléphone, e-mail, référence de demande ou immatriculation." />
        </Card>
      </>
    )
  }

  const digits = q.replace(/\D/g, '')
  const plate = q.toUpperCase().replace(/[\s-]/g, '')
  const [requests, vehicles, appointments] = await Promise.all([
    payload.find({
      collection: 'requests',
      sort: '-createdAt',
      where: {
        or: [
          { reference: { like: q } },
          { firstName: { like: q } },
          { lastName: { like: q } },
          { email: { like: q } },
          ...(digits.length >= 4 ? [{ phone: { like: digits.slice(-8) } }] : []),
        ],
      },
      ...opts,
    }),
    payload.find({
      collection: 'vehicles',
      sort: '-updatedAt',
      draft: true,
      where: {
        or: [
          { title: { like: q } },
          { reference: { like: q } },
          { plate: { like: q } },
          ...(plate.length >= 5 ? [{ plate: { like: `${plate.slice(0, 2)}-${plate.slice(2, 5)}` } }] : []),
        ],
      },
      ...opts,
    }),
    payload.find({
      collection: 'appointments',
      sort: '-startsAt',
      where: { or: [{ name: { like: q } }, { email: { like: q } }, ...(digits.length >= 4 ? [{ phone: { like: digits.slice(-8) } }] : [])] },
      ...opts,
    }),
  ])
  const total = requests.totalDocs + vehicles.totalDocs + appointments.totalDocs

  return (
    <>
      <PageHeader title={`Recherche : « ${q} »`} subtitle={total ? `${total} résultat${total > 1 ? 's' : ''}` : 'Aucun résultat'} />
      {total === 0 ? (
        <Card>
          <Empty icon={Search} title="Aucun résultat" text="Vérifiez l’orthographe, ou cherchez par téléphone, e-mail, référence (LA-…) ou immatriculation." />
        </Card>
      ) : (
        <div className="space-y-6">
          {requests.docs.length > 0 && (
            <Card title={`Demandes (${requests.totalDocs})`} icon={FolderOpen} padded={false}>
              <ul className="divide-y divide-line">
                {requests.docs.map((r) => (
                  <li key={r.id}>
                    <Link href={`/gestion/demandes/${r.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3.5 hover:bg-soft">
                      <strong className="text-primary">
                        {r.firstName} {r.lastName}
                      </strong>
                      <Badge className={REQUEST_STATUS_TONE[r.status]}>{requestStatusLabel(r)}</Badge>
                      <span className="text-sm text-ink-2">
                        {REQUEST_TYPES[r.type]} · {r.reference} · {r.phone} · {fmtDate(r.createdAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {vehicles.docs.length > 0 && (
            <Card title={`Véhicules (${vehicles.totalDocs})`} icon={CarFront} padded={false}>
              <ul className="divide-y divide-line">
                {vehicles.docs.map((v) => (
                  <li key={v.id}>
                    <Link href={`/gestion/vehicules/${v.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3.5 hover:bg-soft">
                      <strong className="text-primary">{v.title}</strong>
                      <Badge className={VEHICLE_STATUS_TONE[v.status]}>{VEHICLE_STATUS[v.status]}</Badge>
                      {v._status === 'draft' && <Badge>Brouillon</Badge>}
                      <span className="text-sm text-ink-2">
                        {v.plate ?? 'Sans plaque'} · {euro(v.price)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {appointments.docs.length > 0 && (
            <Card title={`Rendez-vous (${appointments.totalDocs})`} icon={CalendarDays} padded={false}>
              <ul className="divide-y divide-line">
                {appointments.docs.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3.5">
                    <strong className="text-primary">{a.name}</strong>
                    <span className="text-sm text-ink-2">
                      {APPOINTMENT_KINDS[a.kind]} · {fmtDateTime(a.startsAt)} · {a.phone}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </>
  )
}
