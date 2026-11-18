import { CalendarDays, CarFront, ExternalLink, History, Mail, MessageCircle, MessageSquareText, Phone, UserRound } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import { DocumentsPanel, type DocFile } from '@/components/gestion/demandes/DocumentsPanel'
import { fileUrl, fullName, idOf, isLate, trackingUrl, whatsappHref } from '@/components/gestion/demandes/format'
import { AssignSelect, RequestActions } from '@/components/gestion/demandes/RequestActions'
import { AppointmentDialog, CopyLinkButton, NoteForm } from '@/components/gestion/demandes/SideActions'
import { loadTeam } from '@/components/gestion/demandes/team'
import { Badge, btn, Card, PageHeader, Steps } from '@/components/gestion/ui'
import {
  APPOINTMENT_KINDS,
  APPOINTMENT_STATUS,
  euro,
  FINANCING_STEPS,
  fmtDateTime,
  FORMULAS,
  km,
  PROFILES,
  REQUEST_STATUS_TONE,
  REQUEST_TYPES,
  requestStatusLabel,
  requestStep,
  SIMPLE_STEPS,
  telHref,
} from '@/lib/gestion/labels'
import { requireStaff } from '@/lib/gestion/session'
import { REFUSAL_REASONS } from '@/lib/refusal-reasons'

export const metadata: Metadata = { title: 'Demande' }

function Facts({ items }: { items: [string, ReactNode][] }) {
  const shown = items.filter(([, v]) => v != null && v !== '' && v !== '—')
  if (!shown.length) return null
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {shown.map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs font-bold text-ink-3">{k}</dt>
          <dd className="text-sm font-semibold text-primary">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

export default async function DemandePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id <= 0) notFound()
  const { payload, user } = await requireStaff()

  const r = await payload
    .findByID({ collection: 'requests', id, depth: 1, populate: { vehicles: { title: true, slug: true } }, user, overrideAccess: false })
    .catch(() => null)
  if (!r) notFound()

  const [docs, appointments, team] = await Promise.all([
    payload.find({
      collection: 'documents',
      where: { request: { equals: id } },
      sort: 'createdAt',
      limit: 200,
      depth: 0,
      select: { filename: true, kind: true, createdAt: true },
      user,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'appointments',
      where: { or: [{ request: { equals: id } }, { email: { equals: r.email } }] },
      sort: '-startsAt',
      limit: 20,
      depth: 0,
      user,
      overrideAccess: false,
    }),
    loadTeam(payload),
  ])

  const names = new Map(team.map((m) => [m.id, m.name]))
  const assignedId = idOf(r.assignedTo)
  const assigned = team.find((m) => m.id === assignedId)
  // Membres actifs, plus le conseiller actuel s'il a été désactivé (pour que la liste affiche la bonne valeur).
  const members = team.filter((m) => m.active || m.id === assignedId)
  const vehicle = r.vehicle && typeof r.vehicle === 'object' ? r.vehicle : null
  const financing = r.type === 'financing'
  const files: DocFile[] = docs.docs.filter((d) => d.filename).map((d) => ({ id: d.id, filename: d.filename!, kind: d.kind ?? null, createdAt: d.createdAt }))
  const photos = files.filter((f) => f.kind === 'tradein-photo')
  const notes = [...(r.notes ?? [])].sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''))
  const history = [...(r.history ?? [])].reverse()
  const refusal = REFUSAL_REASONS.find((x) => x.value === r.refusalReason)?.label

  return (
    <>
      <PageHeader
        back={{ href: '/gestion/demandes', label: 'Demandes' }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {fullName(r)}
            <Badge className={REQUEST_STATUS_TONE[r.status]}>{requestStatusLabel(r)}</Badge>
            {isLate(r) && <Badge className="bg-accent-soft text-accent-dark">En retard</Badge>}
          </span>
        }
        subtitle={
          <>
            {REQUEST_TYPES[r.type]} · Réf. <span className="font-semibold text-primary">{r.reference}</span> · reçue le {fmtDateTime(r.createdAt)}
          </>
        }
        actions={<RequestActions id={r.id} type={r.type} status={r.status} />}
      />

      <div className="mb-6">
        <Card>
          <Steps steps={financing ? FINANCING_STEPS : SIMPLE_STEPS} current={requestStep(r)} done={r.status === 'delivered'} stopped={r.status === 'refused'} />
          {r.status === 'refused' && (
            <div className="mt-4 rounded-xl bg-soft px-4 py-3 text-sm">
              <p className="font-bold text-primary">
                {financing ? 'Refusé' : 'Classé sans suite'} : {refusal ?? 'motif non renseigné'}
              </p>
              {r.refusalNote && <p className="mt-1 whitespace-pre-line text-ink-2">{r.refusalNote}</p>}
              <p className="mt-1 text-xs text-ink-3">Usage interne, jamais montré au client.</p>
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <AssignSelect id={r.id} current={assignedId} members={members} />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Card title="Projet" icon={CarFront}>
            <div className="space-y-5">
              {vehicle && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-soft px-4 py-3">
                  <div>
                    <p className="text-xs font-bold text-ink-3">Véhicule</p>
                    <Link href={`/gestion/vehicules/${vehicle.id}`} className="font-black text-primary hover:text-accent">
                      {vehicle.title}
                    </Link>
                  </div>
                  {vehicle.slug && (
                    <a href={`/vehicule/${vehicle.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-ink-2 hover:text-primary">
                      Annonce sur le site <ExternalLink className="size-3.5" aria-hidden />
                      <span className="sr-only">(nouvel onglet)</span>
                    </a>
                  )}
                </div>
              )}
              {financing && (
                <Facts
                  items={[
                    ['Formule', r.formula ? FORMULAS[r.formula] : null],
                    ['Durée', r.months ? `${r.months} mois` : null],
                    ['Apport', r.deposit != null ? euro(r.deposit) : null],
                    ['Situation', r.profile ? PROFILES[r.profile] : null],
                    ['Revenus mensuels nets', r.monthlyIncome != null ? euro(r.monthlyIncome) : null],
                    ['Budget mensuel', r.monthlyBudget != null ? euro(r.monthlyBudget) : null],
                  ]}
                />
              )}
              {r.type === 'tradein' && (
                <>
                  <Facts
                    items={[
                      ['Marque', r.tradeIn?.brand],
                      ['Modèle', r.tradeIn?.model],
                      ['Année', r.tradeIn?.year],
                      ['Kilométrage', r.tradeIn?.mileage != null ? km(r.tradeIn.mileage) : null],
                      ['Estimation proposée', r.tradeIn?.estimate != null ? euro(r.tradeIn.estimate) : null],
                    ]}
                  />
                  {photos.length > 0 && (
                    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {photos.map((p) => (
                        <li key={p.id}>
                          <a href={fileUrl(p.filename)} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-line focus-visible:ring-3 focus-visible:ring-accent/40">
                            {/* eslint-disable-next-line @next/next/no-img-element -- fichier privé servi par l'API, réservé à l'équipe */}
                            <img src={fileUrl(p.filename)} alt={`Photo du véhicule à reprendre (${p.filename})`} className="aspect-4/3 w-full object-cover" loading="lazy" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
              {r.message ? (
                <blockquote className="rounded-xl border-l-4 border-accent bg-soft px-4 py-3 text-sm whitespace-pre-line text-ink-2">
                  <span className="mb-1 block text-xs font-bold text-ink-3">Message du client</span>
                  {r.message}
                </blockquote>
              ) : (
                !financing && r.type !== 'tradein' && !vehicle && <p className="text-sm text-ink-3">Le client n’a pas laissé de message.</p>
              )}
            </div>
          </Card>

          <DocumentsPanel requestId={r.id} financing={financing} profile={r.profile ?? null} missing={!!r.missingDocuments} files={files} canDelete={user.role === 'admin'} />

          <Card title="Notes internes" icon={MessageSquareText}>
            <NoteForm id={r.id} />
            {notes.length > 0 ? (
              <ol className="mt-5 space-y-3">
                {notes.map((n, i) => (
                  <li key={n.id ?? i} className="rounded-xl bg-soft px-4 py-3">
                    <p className="text-sm whitespace-pre-line text-primary">{n.text}</p>
                    <p className="mt-1 text-xs text-ink-3">
                      {names.get(idOf(n.author) ?? -1) ?? 'Automatique'} · {fmtDateTime(n.at)}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-sm text-ink-3">Aucune note pour l’instant.</p>
            )}
          </Card>

          <Card title="Historique" icon={History}>
            {history.length ? (
              <ol className="space-y-2.5 border-l-2 border-line pl-4">
                {history.map((h, i) => (
                  <li key={h.id ?? i} className="text-sm">
                    <span className="font-bold text-primary">{h.status ? requestStatusLabel({ type: r.type, status: h.status }) : '—'}</span>
                    <span className="text-ink-2">
                      {' '}
                      · {fmtDateTime(h.at)} · {names.get(idOf(h.by) ?? -1) ?? (h.status === 'new' ? 'formulaire du site' : 'automatique')}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-ink-3">Pas encore de changement de statut.</p>
            )}
          </Card>
        </div>

        <aside className="space-y-6">
          <Card title="Contact" icon={Phone}>
            <a href={telHref(r.phone)} className="block text-2xl font-black text-primary hover:text-accent">
              {r.phone}
            </a>
            <p className="mt-1 text-sm break-all text-ink-2">{r.email}</p>
            {r.postalCode && <p className="mt-0.5 text-sm text-ink-3">Code postal : {r.postalCode}</p>}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <a href={telHref(r.phone)} className={`${btn.primary} ${btn.small} flex-col py-2.5!`}>
                <Phone className="size-4" aria-hidden /> Appeler
              </a>
              <a href={`mailto:${r.email}?subject=${encodeURIComponent(`Votre demande ${r.reference ?? ''}`.trim())}`} className={`${btn.ghost} ${btn.small} flex-col py-2.5!`}>
                <Mail className="size-4" aria-hidden /> E-mail
              </a>
              <a href={whatsappHref(r.phone)} target="_blank" rel="noopener noreferrer" className={`${btn.ghost} ${btn.small} flex-col py-2.5!`}>
                <MessageCircle className="size-4" aria-hidden /> WhatsApp
              </a>
            </div>
            {r.reference && (
              <div className="mt-3">
                <CopyLinkButton url={trackingUrl(r.reference)} />
              </div>
            )}
          </Card>

          <Card title="Rendez-vous" icon={CalendarDays}>
            {appointments.docs.length ? (
              <ul className="mb-4 space-y-2">
                {appointments.docs.map((a) => (
                  <li key={a.id} className="rounded-xl bg-soft px-3.5 py-2.5 text-sm">
                    <span className="block font-bold text-primary">{fmtDateTime(a.startsAt)}</span>
                    <span className="text-ink-2">
                      {APPOINTMENT_KINDS[a.kind]} · {APPOINTMENT_STATUS[a.status]}
                      {idOf(a.request) !== r.id && ' · autre demande'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-4 text-sm text-ink-3">Aucun rendez-vous.</p>
            )}
            <AppointmentDialog id={r.id} vehicleTitle={vehicle?.title ?? null} />
          </Card>

          <Card title="Conseiller" icon={UserRound}>
            {assigned ? (
              <>
                <p className="font-bold text-primary">{assigned.name}</p>
                <p className="text-sm break-all text-ink-2">{assigned.email}</p>
              </>
            ) : (
              <p className="text-sm text-ink-2">Personne ne suit ce dossier. Choisissez un conseiller en haut de la fiche, ou prenez-le en charge.</p>
            )}
            <dl className="mt-3 space-y-1 text-xs text-ink-3">
              <div>
                <dt className="inline">Dernière action de l’équipe : </dt>
                <dd className="inline">{fmtDateTime(r.lastActionAt)}</dd>
              </div>
              {financing && (
                <div>
                  <dt className="inline">Relances automatiques envoyées : </dt>
                  <dd className="inline">{r.remindersSent ?? 0}</dd>
                </div>
              )}
            </dl>
          </Card>
        </aside>
      </div>
    </>
  )
}
