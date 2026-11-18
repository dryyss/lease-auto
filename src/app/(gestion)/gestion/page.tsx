import {
  AlertTriangle,
  CalendarCheck,
  CalendarDays,
  CarFront,
  CheckCircle2,
  Clock,
  FileWarning,
  FolderOpen,
  Inbox,
  Phone,
  Plus,
  ScanSearch,
  TrendingUp,
  Truck,
  type LucideIcon,
} from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { Badge, btn, Card, Empty, StatCard } from '@/components/gestion/ui'
import { parisNow, parisTime } from '@/lib/agenda'
import {
  ago,
  APPOINTMENT_KINDS,
  fmtTime,
  FORMULAS,
  plural,
  REQUEST_STATUS_TONE,
  REQUEST_TYPES,
  requestStatusLabel,
  telHref,
} from '@/lib/gestion/labels'
import { requireStaff } from '@/lib/gestion/session'
import type { Request } from '@/payload-types'

export const metadata: Metadata = { title: 'Tableau de bord' }

const H = 3_600_000
const D = 24 * H
const iso = (ms: number) => new Date(ms).toISOString()

/** Ce que le client veut, en une ligne. */
const what = (r: Request) =>
  [
    REQUEST_TYPES[r.type],
    r.vehicle && typeof r.vehicle === 'object' ? r.vehicle.title : r.tradeIn?.brand ? `${r.tradeIn.brand} ${r.tradeIn.model ?? ''}` : null,
    r.formula ? FORMULAS[r.formula] : null,
  ]
    .filter(Boolean)
    .join(' · ')

export default async function DashboardPage() {
  const { payload, user } = await requireStaff()
  const admin = user.role === 'admin'
  const q = { user, overrideAccess: false as const }

  const now = Date.now()
  const p = parisNow(now)
  const dayStart = parisTime(p.y, p.m, p.d, 0, 0)
  const tomorrowEnd = parisTime(p.y, p.m, p.d + 2, 0, 0)
  const monthStart = parisTime(p.y, p.m, 1, 0, 0)
  const sixMonthsStart = parisTime(p.y, p.m - 5, 1, 0, 0)

  const settings = await payload.findGlobal({ slug: 'settings', depth: 0 })
  const staleHours = settings.retention?.internalReminderHours ?? 24
  const mine = { assignedTo: { equals: user.id } }
  const working = { status: { in: ['review', 'approved'] } }

  const [
    nNew, nReview, nApproved, nDeliveredMonth, nStale, nMissing, nOverdue,
    carsOnline, carsReserved, carsDraft, carsNoPlate, todayAppts,
    toTake, inProgress, recentDocs, period,
  ] = await Promise.all([
    payload.count({ collection: 'requests', where: { status: { equals: 'new' } }, ...q }),
    payload.count({ collection: 'requests', where: { status: { equals: 'review' } }, ...q }),
    payload.count({ collection: 'requests', where: { and: [{ type: { equals: 'financing' } }, { status: { equals: 'approved' } }] }, ...q }),
    payload.count({ collection: 'requests', where: { and: [{ type: { equals: 'financing' } }, { status: { equals: 'delivered' } }, { deliveredAt: { greater_than_equal: iso(monthStart) } }] }, ...q }),
    payload.count({ collection: 'requests', where: { and: [{ status: { equals: 'new' } }, { createdAt: { less_than: iso(now - staleHours * H) } }] }, ...q }),
    payload.count({ collection: 'requests', where: { and: [{ type: { equals: 'financing' } }, { missingDocuments: { equals: true } }, { status: { in: ['new', 'review'] } }] }, ...q }),
    payload.count({ collection: 'appointments', where: { and: [{ status: { equals: 'confirmed' } }, { startsAt: { less_than: iso(dayStart) } }] }, ...q }),
    payload.count({ collection: 'vehicles', where: { and: [{ _status: { equals: 'published' } }, { status: { equals: 'available' } }] }, ...q }),
    payload.count({ collection: 'vehicles', where: { status: { equals: 'reserved' } }, ...q }),
    payload.count({ collection: 'vehicles', where: { _status: { equals: 'draft' } }, ...q }),
    payload.count({ collection: 'vehicles', where: { and: [{ status: { not_equals: 'sold' } }, { or: [{ plate: { exists: false } }, { plate: { equals: '' } }] }] }, ...q }),
    payload.find({
      collection: 'appointments',
      where: { and: [{ status: { equals: 'confirmed' } }, { startsAt: { greater_than_equal: iso(dayStart) } }, { startsAt: { less_than: iso(tomorrowEnd) } }] },
      sort: 'startsAt',
      limit: 12,
      depth: 1,
      ...q,
    }),
    payload.find({ collection: 'requests', where: { status: { equals: 'new' } }, sort: 'createdAt', limit: 5, depth: 1, ...q }),
    payload.find({ collection: 'requests', where: admin ? working : { and: [working, mine] }, sort: '-updatedAt', limit: 5, depth: 1, ...q }),
    payload.find({ collection: 'documents', where: { createdAt: { greater_than_equal: iso(now - 3 * D) } }, sort: '-createdAt', limit: 50, depth: 0, ...q, select: { request: true } }),
    payload.find({
      collection: 'requests',
      where: { createdAt: { greater_than_equal: iso(sixMonthsStart) } },
      limit: 5000,
      pagination: false,
      depth: 0,
      ...q,
      select: { createdAt: true, type: true, status: true, history: true },
    }),
  ])

  /* Tendance : demandes reçues et dossiers livrés par mois, sur 6 mois. */
  const months = Array.from({ length: 6 }, (_, i) => {
    const from = parisTime(p.y, p.m - 5 + i, 1, 0, 0)
    const to = parisTime(p.y, p.m - 4 + i, 1, 0, 0)
    const inMonth = period.docs.filter((r) => {
      const t = new Date(r.createdAt).getTime()
      return t >= from && t < to
    })
    return {
      label: new Date(from + 12 * H).toLocaleDateString('fr-FR', { month: 'short', timeZone: 'Europe/Paris' }),
      received: inMonth.length,
      won: inMonth.filter((r) => r.type === 'financing' && (r.status === 'approved' || r.status === 'delivered')).length,
    }
  })
  const monthMax = Math.max(1, ...months.map((m) => m.received))

  /* Entonnoir des financements des 30 derniers jours. */
  const last30 = period.docs.filter((r) => r.type === 'financing' && new Date(r.createdAt).getTime() >= now - 30 * D)
  const funnel = [
    { label: 'Reçues', n: last30.length },
    { label: 'Prises en charge', n: last30.filter((r) => r.status !== 'new').length },
    { label: 'Accords', n: last30.filter((r) => r.status === 'approved' || r.status === 'delivered').length },
    { label: 'Livrées', n: last30.filter((r) => r.status === 'delivered').length },
  ]
  const byType = (Object.keys(REQUEST_TYPES) as Request['type'][]).map((t) => ({
    t,
    n: period.docs.filter((r) => r.type === t && new Date(r.createdAt).getTime() >= now - 30 * D).length,
  }))
  const typeMax = Math.max(1, ...byType.map((b) => b.n))

  /* Pièces déposées ces 3 derniers jours, par dossier. */
  const docRequests = [...new Set(recentDocs.docs.map((d) => (typeof d.request === 'object' ? d.request?.id : d.request)).filter(Boolean))] as number[]

  const todo: { tone: 'red' | 'amber' | 'navy'; icon: LucideIcon; n: number; title: string; text: string; href: string }[] = [
    { tone: 'red' as const, icon: Clock, n: nStale.totalDocs, title: `${plural(nStale.totalDocs, 'demande')} sans réponse depuis plus de ${staleHours} h`, text: 'Le client attend un premier appel.', href: '/gestion/demandes?retard=1' },
    {
      tone: 'navy' as const,
      icon: ScanSearch,
      n: docRequests.length,
      title: `${plural(docRequests.length, 'dossier')} avec de nouvelles pièces`,
      text: 'Déposées ces 3 derniers jours : à vérifier.',
      href: docRequests.length === 1 ? `/gestion/demandes/${docRequests[0]}` : '/gestion/demandes?tri=recent',
    },
    { tone: 'amber' as const, icon: FileWarning, n: nMissing.totalDocs, title: plural(nMissing.totalDocs, 'dossier incomplet', 'dossiers incomplets'), text: 'Pièces attendues. Relances automatiques à 48 h et 5 jours.', href: '/gestion/demandes?pieces=1' },
    { tone: 'red' as const, icon: CalendarDays, n: nOverdue.totalDocs, title: `${plural(nOverdue.totalDocs, 'rendez-vous passé', 'rendez-vous passés')} à clôturer`, text: 'Indiquez s’ils ont été honorés ou non.', href: '/gestion/rendez-vous?vue=liste&filtre=a-cloturer' },
    { tone: 'amber' as const, icon: CarFront, n: carsNoPlate.totalDocs, title: `${plural(carsNoPlate.totalDocs, 'véhicule')} sans immatriculation`, text: 'À compléter pour retrouver chaque voiture facilement.', href: '/gestion/vehicules?filtre=a-completer' },
  ].filter((t) => t.n > 0)

  const greeting = p.hour >= 5 && p.hour < 18 ? 'Bonjour' : 'Bonsoir'
  const firstName = (user.name ?? '').split(' ')[0]
  const today = new Date(now).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' })
  const TONE = { red: 'bg-accent-soft text-accent', amber: 'bg-amber-50 text-amber-700', navy: 'bg-primary/10 text-primary' }

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink-3 first-letter:uppercase">{today}</p>
          <h1 className="text-2xl font-black text-primary sm:text-3xl">
            {greeting}
            {firstName ? ` ${firstName}` : ''}
          </h1>
          <p className="mt-1 text-sm text-ink-2">
            {todo.length ? `${plural(todo.length, 'point')} à traiter aujourd’hui.` : 'Rien d’urgent : tout est à jour.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/gestion/demandes" className={btn.ghost}>
            <FolderOpen className="size-4" aria-hidden /> Toutes les demandes
          </Link>
          <Link href="/gestion/vehicules/nouveau" className={btn.primary}>
            <Plus className="size-4" aria-hidden /> Ajouter un véhicule
          </Link>
        </div>
      </header>

      <section aria-label="Chiffres clés" className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard href="/gestion/demandes?statut=new" label="Nouvelles demandes" value={nNew.totalDocs} hint={nStale.totalDocs ? `${nStale.totalDocs} en retard` : 'à prendre en charge'} icon={Inbox} tone="red" />
        <StatCard href="/gestion/demandes?statut=review" label="En étude" value={nReview.totalDocs} hint="dossiers en cours" icon={FolderOpen} tone="navy" />
        <StatCard href="/gestion/demandes?statut=approved" label="Accords" value={nApproved.totalDocs} hint="à livrer" icon={CheckCircle2} tone="green" />
        <StatCard href="/gestion/demandes?statut=delivered" label="Livrées ce mois" value={nDeliveredMonth.totalDocs} hint="financements" icon={Truck} tone="sky" />
        <StatCard href="/gestion/vehicules?filtre=disponibles" label="Véhicules en ligne" value={carsOnline.totalDocs} hint={`${carsReserved.totalDocs} réservé${carsReserved.totalDocs > 1 ? 's' : ''} · ${plural(carsDraft.totalDocs, 'brouillon')}`} icon={CarFront} tone="slate" />
        <StatCard href="/gestion/rendez-vous" label="Rendez-vous aujourd’hui" value={todayAppts.docs.filter((a) => new Date(a.startsAt).getTime() < parisTime(p.y, p.m, p.d + 1, 0, 0)).length} hint="voir l’agenda" icon={CalendarCheck} tone="amber" />
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="À traiter aujourd’hui" icon={AlertTriangle} padded={false}>
            {todo.length === 0 ? (
              <Empty icon={CheckCircle2} title="Tout est à jour" text="Aucune demande en retard, aucun dossier en attente." />
            ) : (
              <ul className="divide-y divide-line">
                {todo.map((t) => (
                  <li key={t.title}>
                    <Link href={t.href} className="flex items-center gap-4 px-5 py-4 transition hover:bg-soft">
                      <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${TONE[t.tone]}`}>
                        <t.icon className="size-5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold text-primary">{t.title}</span>
                        <span className="block text-sm text-ink-2">{t.text}</span>
                      </span>
                      <span className="text-sm font-bold text-accent">Voir</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card
            title={`Demandes à prendre (${nNew.totalDocs})`}
            icon={Inbox}
            padded={false}
            action={
              <Link href="/gestion/demandes?statut=new" className="text-sm font-bold text-accent hover:underline">
                Tout voir
              </Link>
            }
          >
            {toTake.docs.length === 0 ? (
              <Empty icon={CheckCircle2} title="Aucune nouvelle demande" text="Toutes les demandes ont été prises en charge." />
            ) : (
              <RequestList requests={toTake.docs} staleBefore={now - staleHours * H} />
            )}
          </Card>

          <Card
            title={admin ? 'Dossiers en cours' : 'Mes dossiers en cours'}
            icon={FolderOpen}
            padded={false}
            action={
              <Link href={admin ? '/gestion/demandes?statut=review' : '/gestion/demandes?mes=1'} className="text-sm font-bold text-accent hover:underline">
                Tout voir
              </Link>
            }
          >
            {inProgress.docs.length === 0 ? (
              <Empty icon={FolderOpen} title="Aucun dossier en cours" text={admin ? 'Aucun dossier en étude ou accordé.' : 'Prenez une demande ci-dessus pour commencer.'} />
            ) : (
              <RequestList requests={inProgress.docs} showStatus />
            )}
          </Card>

          <Card title="Activité sur 6 mois" icon={TrendingUp}>
            <div className="flex h-44 items-end gap-3 sm:gap-6" role="img" aria-label={months.map((m) => `${m.label} : ${m.received} demandes, ${m.won} accords`).join(', ')}>
              {months.map((m) => (
                <div key={m.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  <span className="text-xs font-bold text-primary">{m.received}</span>
                  <span className="relative w-full max-w-14 overflow-hidden rounded-t-lg bg-primary/15" style={{ height: `${Math.max(4, (m.received / monthMax) * 100)}%` }}>
                    <span className="absolute inset-x-0 bottom-0 bg-emerald-500" style={{ height: m.received ? `${(m.won / m.received) * 100}%` : 0 }} />
                  </span>
                  <span className="text-xs text-ink-3 capitalize">{m.label}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 flex flex-wrap gap-4 text-xs text-ink-2">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-primary/15" /> Demandes reçues
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-emerald-500" /> dont financements accordés
              </span>
            </p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card
            title="Agenda"
            icon={CalendarDays}
            padded={false}
            action={
              <Link href="/gestion/rendez-vous" className="text-sm font-bold text-accent hover:underline">
                Semaine
              </Link>
            }
          >
            {todayAppts.docs.length === 0 ? (
              <Empty icon={CalendarDays} title="Aucun rendez-vous" text="Ni aujourd’hui, ni demain." />
            ) : (
              <ul className="divide-y divide-line">
                {todayAppts.docs.map((a) => {
                  const tomorrow = new Date(a.startsAt).getTime() >= parisTime(p.y, p.m, p.d + 1, 0, 0)
                  return (
                    <li key={a.id} className="flex items-center gap-3 px-5 py-3.5">
                      <span className="w-14 shrink-0 text-center">
                        <span className="block text-sm font-black text-primary">{fmtTime(a.startsAt)}</span>
                        <span className="block text-[11px] font-semibold text-ink-3">{tomorrow ? 'demain' : 'aujourd’hui'}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold text-primary">{a.name}</span>
                        <span className="block truncate text-xs text-ink-2">
                          {APPOINTMENT_KINDS[a.kind]}
                          {a.vehicle && typeof a.vehicle === 'object' ? ` · ${a.vehicle.title}` : ''}
                        </span>
                      </span>
                      <a href={telHref(a.phone)} className="flex size-9 items-center justify-center rounded-xl border border-line text-primary hover:bg-soft" aria-label={`Appeler ${a.name}`}>
                        <Phone className="size-4" aria-hidden />
                      </a>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          <Card title="Financements, 30 jours" icon={TrendingUp}>
            <ol className="space-y-3">
              {funnel.map((f, i) => (
                <li key={f.label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-semibold text-ink-2">{f.label}</span>
                    <span className="font-black text-primary">
                      {f.n}
                      {i > 0 && funnel[0].n > 0 && <span className="ml-1.5 text-xs font-semibold text-ink-3">{Math.round((f.n / funnel[0].n) * 100)} %</span>}
                    </span>
                  </div>
                  <span className="block h-2.5 overflow-hidden rounded-full bg-soft">
                    <span className={`block h-full rounded-full ${i === 3 ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${funnel[0].n ? (f.n / funnel[0].n) * 100 : 0}%` }} />
                  </span>
                </li>
              ))}
            </ol>
          </Card>

          <Card title="Demandes par type, 30 jours" icon={FolderOpen}>
            <ul className="space-y-3">
              {byType.map(({ t, n }) => (
                <li key={t}>
                  <Link href={`/gestion/demandes?type=${t}`} className="group block">
                    <span className="mb-1 flex justify-between text-sm">
                      <span className="font-semibold text-ink-2 group-hover:text-primary">{REQUEST_TYPES[t]}</span>
                      <span className="font-black text-primary">{n}</span>
                    </span>
                    <span className="block h-2 overflow-hidden rounded-full bg-soft">
                      <span className="block h-full rounded-full bg-accent" style={{ width: `${(n / typeMax) * 100}%` }} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  )
}

function RequestList({ requests, staleBefore, showStatus = false }: { requests: Request[]; staleBefore?: number; showStatus?: boolean }) {
  return (
    <ul className="divide-y divide-line">
      {requests.map((r) => {
        const late = staleBefore != null && new Date(r.createdAt).getTime() < staleBefore
        const owner = r.assignedTo && typeof r.assignedTo === 'object' ? r.assignedTo.name : null
        return (
          <li key={r.id} className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-soft">
            <Link href={`/gestion/demandes/${r.id}`} className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <strong className="text-primary">
                  {r.firstName} {r.lastName}
                </strong>
                {showStatus && <Badge className={REQUEST_STATUS_TONE[r.status]}>{requestStatusLabel(r)}</Badge>}
                {late && <Badge className="bg-accent text-white">En retard</Badge>}
                {r.type === 'financing' && r.missingDocuments && <Badge className="bg-amber-100 text-amber-800">Pièces manquantes</Badge>}
              </span>
              <span className="mt-0.5 block truncate text-sm text-ink-2">{what(r)}</span>
              <span className="mt-0.5 block text-xs text-ink-3">
                Reçue {ago(r.createdAt)}
                {owner ? ` · ${owner}` : ''} · {r.reference}
              </span>
            </Link>
            <a href={telHref(r.phone)} className="hidden items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-sm font-bold text-primary hover:bg-soft sm:inline-flex">
              <Phone className="size-4" aria-hidden /> {r.phone}
            </a>
            <a href={telHref(r.phone)} className="flex size-9 items-center justify-center rounded-xl border border-line text-primary sm:hidden" aria-label={`Appeler ${r.firstName} ${r.lastName}`}>
              <Phone className="size-4" aria-hidden />
            </a>
          </li>
        )
      })}
    </ul>
  )
}
