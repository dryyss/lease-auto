import { CalendarDays, ExternalLink, FileText, FolderOpen, Mail, Phone, UserRound } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { KindBadge, StatusBadge } from '@/components/gestion/rendez-vous/badges'
import { parisDayKey } from '@/components/gestion/rendez-vous/dates'
import { Badge, btn, Card, Empty, PageHeader } from '@/components/gestion/ui'
import { DOCUMENT_KIND_LABELS, fmtDate, fmtDateTime, REQUEST_STATUS_TONE, REQUEST_TYPES, requestStatusLabel, telHref } from '@/lib/gestion/labels'
import { requireStaff } from '@/lib/gestion/session'

type Params = Promise<{ email: string }>

/** L'e-mail arrive encodé dans l'URL (« jean%40exemple.fr »). */
function emailOf(raw: string) {
  try {
    return decodeURIComponent(raw).trim().toLowerCase()
  } catch {
    return raw.trim().toLowerCase()
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return { title: `Client ${emailOf((await params).email)}` }
}

export default async function ClientPage({ params }: { params: Params }) {
  const email = emailOf((await params).email)
  const { payload, user } = await requireStaff()
  const same = (s: string | null | undefined) => (s ?? '').trim().toLowerCase() === email

  // « like » ne tient pas compte des majuscules ; on garde ensuite l'égalité exacte.
  const [requestsRes, apptRes, subRes] = await Promise.all([
    payload.find({
      collection: 'requests',
      where: { email: { like: email } },
      sort: '-createdAt',
      limit: 200,
      depth: 1,
      select: { reference: true, type: true, status: true, createdAt: true, firstName: true, lastName: true, email: true, phone: true, postalCode: true, vehicle: true, assignedTo: true },
      populate: { vehicles: { title: true }, users: { name: true } },
      user,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'appointments',
      where: { email: { like: email } },
      sort: '-startsAt',
      limit: 100,
      depth: 1,
      populate: { vehicles: { title: true }, requests: { reference: true } },
      user,
      overrideAccess: false,
    }),
    payload.find({ collection: 'subscribers', where: { email: { like: email } }, limit: 5, depth: 0, select: { email: true, newsletter: true, alertEnabled: true }, user, overrideAccess: false }),
  ])
  const requests = requestsRes.docs.filter((r) => same(r.email))
  const appointments = apptRes.docs.filter((a) => same(a.email))
  const subscriber = subRes.docs.find((s) => same(s.email))

  const header = { back: { href: '/gestion/clients', label: 'Clients' } }
  if (!requests.length && !appointments.length) {
    return (
      <>
        <PageHeader title="Client introuvable" {...header} />
        <Card>
          <Empty icon={UserRound} title={`Aucune demande ni rendez-vous pour ${email}.`} text="L’adresse a peut-être été modifiée. Cherchez le client par son nom ou son téléphone." />
        </Card>
      </>
    )
  }

  const documents = requests.length
    ? await payload.find({
        collection: 'documents',
        where: { request: { in: requests.map((r) => r.id) } },
        sort: '-createdAt',
        limit: 200,
        depth: 0,
        select: { filename: true, kind: true, request: true, createdAt: true },
        user,
        overrideAccess: false,
      })
    : null
  const refOf = new Map(requests.map((r) => [r.id, r.reference]))

  const latest = requests[0]
  const name = latest ? `${latest.firstName ?? ''} ${latest.lastName ?? ''}`.trim() : appointments[0].name
  const phone = latest?.phone || appointments[0]?.phone || ''
  const now = Date.now()
  const upcoming = appointments.filter((a) => a.status === 'confirmed' && new Date(a.startsAt).getTime() >= now)

  return (
    <>
      <PageHeader
        title={name || email}
        subtitle={email}
        {...header}
        actions={
          <>
            {phone && (
              <a href={telHref(phone)} className={btn.primary}>
                <Phone className="size-4" aria-hidden /> Appeler
              </a>
            )}
            <a href={`mailto:${email}`} className={btn.ghost}>
              <Mail className="size-4" aria-hidden /> Écrire
            </a>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title={`Demandes (${requests.length})`} icon={FolderOpen} padded={false}>
            {requests.length ? (
              <ul className="divide-y divide-line">
                {requests.map((r) => {
                  const vehicle = r.vehicle && typeof r.vehicle === 'object' ? r.vehicle.title : null
                  const owner = r.assignedTo && typeof r.assignedTo === 'object' ? r.assignedTo.name : null
                  return (
                    <li key={r.id} className="relative flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 hover:bg-soft/60">
                      <div className="min-w-0 flex-1">
                        <Link href={`/gestion/demandes/${r.id}`} className="font-bold text-primary after:absolute after:inset-0 hover:text-accent">
                          {REQUEST_TYPES[r.type]} · {r.reference ?? `n° ${r.id}`}
                        </Link>
                        <p className="truncate text-sm text-ink-2">
                          {[vehicle, owner && `Suivie par ${owner}`].filter(Boolean).join(' · ') || 'Sans véhicule précis'}
                        </p>
                      </div>
                      <Badge className={REQUEST_STATUS_TONE[r.status]}>{requestStatusLabel(r)}</Badge>
                      <span className="text-xs text-ink-3">{fmtDate(r.createdAt)}</span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <Empty icon={FolderOpen} title="Aucune demande." text="Ce client a seulement pris rendez-vous." />
            )}
          </Card>

          <Card title={`Rendez-vous (${appointments.length})`} icon={CalendarDays} padded={false}>
            {appointments.length ? (
              <ul className="divide-y divide-line">
                {appointments.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3.5">
                    <Link href={`/gestion/rendez-vous?semaine=${parisDayKey(a.startsAt)}`} className="font-bold text-primary hover:text-accent">
                      {fmtDateTime(a.startsAt)}
                    </Link>
                    <KindBadge kind={a.kind} />
                    <StatusBadge status={a.status} />
                    {a.vehicle && typeof a.vehicle === 'object' && <span className="text-sm text-ink-2">{a.vehicle.title}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <Empty icon={CalendarDays} title="Aucun rendez-vous." />
            )}
          </Card>

          <Card title={`Justificatifs reçus (${documents?.docs.length ?? 0})`} icon={FileText} padded={false}>
            {documents?.docs.length ? (
              <ul className="divide-y divide-line">
                {documents.docs.map((d) => {
                  const reqId = typeof d.request === 'object' ? d.request?.id : d.request
                  return (
                    <li key={d.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3.5">
                      <div className="min-w-0 flex-1">
                        {d.filename ? (
                          <a href={`/api/documents/file/${encodeURIComponent(d.filename)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-bold text-primary hover:text-accent">
                            {DOCUMENT_KIND_LABELS[d.kind ?? 'other'] ?? 'Pièce'} <ExternalLink className="size-3.5" aria-hidden />
                          </a>
                        ) : (
                          <span className="font-bold text-primary">{DOCUMENT_KIND_LABELS[d.kind ?? 'other']}</span>
                        )}
                        <p className="truncate text-xs text-ink-3">{d.filename}</p>
                      </div>
                      {reqId != null && <span className="text-xs text-ink-2">{refOf.get(reqId) ?? ''}</span>}
                      <span className="text-xs text-ink-3">{fmtDate(d.createdAt)}</span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <Empty icon={FileText} title="Aucun justificatif reçu." text="Les pièces envoyées depuis le site ou « Mon espace » apparaîtront ici." />
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Coordonnées" icon={UserRound}>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-bold text-ink-3">Téléphone</dt>
                <dd>
                  {phone ? (
                    <a href={telHref(phone)} className="font-semibold text-primary hover:text-accent">
                      {phone}
                    </a>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-ink-3">E-mail</dt>
                <dd className="break-all">
                  <a href={`mailto:${email}`} className="font-semibold text-primary hover:text-accent">
                    {email}
                  </a>
                </dd>
              </div>
              {latest?.postalCode && (
                <div>
                  <dt className="text-xs font-bold text-ink-3">Code postal</dt>
                  <dd className="font-semibold text-primary">{latest.postalCode}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-bold text-ink-3">Newsletter</dt>
                <dd className="font-semibold text-primary">{subscriber?.newsletter ? 'Oui, abonné' : 'Non'}</dd>
              </div>
              {subscriber?.alertEnabled && (
                <div>
                  <dt className="text-xs font-bold text-ink-3">Alerte véhicule</dt>
                  <dd className="font-semibold text-primary">Activée</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-bold text-ink-3">Prochain rendez-vous</dt>
                <dd className="font-semibold text-primary">{upcoming.length ? fmtDateTime(upcoming[upcoming.length - 1].startsAt) : 'Aucun'}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Suivi en ligne" icon={ExternalLink}>
            <p className="text-sm text-ink-2">
              Le client suit l’avancement de ses demandes et envoie ses justificatifs depuis « Mon espace », avec sa référence et cette adresse e-mail.
            </p>
            {requests[0]?.reference && (
              <p className="mt-2 text-sm text-ink-2">
                Référence à lui donner : <strong className="text-primary">{requests[0].reference}</strong>
              </p>
            )}
            <Link href="/mon-espace" target="_blank" rel="noopener noreferrer" className={`${btn.ghost} mt-4 w-full`}>
              Ouvrir « Mon espace » <ExternalLink className="size-3.5" aria-hidden />
            </Link>
          </Card>
        </div>
      </div>
    </>
  )
}
