/* eslint-disable @next/next/no-html-link-for-pages -- Routes admin Payload (routeur interne, pas des pages Next) */
import config from '@payload-config'
import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'
import type { ReactNode } from 'react'

import { parisNow, parisTime } from '@/lib/agenda'
import type { Appointment, Request } from '@/payload-types'

import { DashAction } from './DashAction'

const TYPE_LABELS: Record<Request['type'], string> = { financing: 'Financement', tradein: 'Reprise', contact: 'Contact', callback: 'Rappel' }
const STATUS: { key: Request['status']; label: string; color: string }[] = [
  { key: 'new', label: 'Nouvelles', color: '#de1d22' },
  { key: 'review', label: 'En étude', color: '#0d2449' },
  { key: 'approved', label: 'Accords', color: '#0f7a4a' },
  { key: 'delivered', label: 'Livrées', color: '#2b5596' },
  { key: 'refused', label: 'Refus', color: '#aeb8c9' },
]
const STATUS_TAG: Record<Request['status'], [string, string]> = {
  new: ['Nouvelle', 'la-tag--red'],
  review: ['En étude', 'la-tag--navy'],
  approved: ['Accord', 'la-tag--green'],
  delivered: ['Livrée', 'la-tag--line'],
  refused: ['Refus', 'la-tag--line'],
}
const FORMULA: Record<string, string> = { loa: 'LOA', lld: 'LLD', credit: 'Crédit' }
const KIND_LABELS: Record<Appointment['kind'], string> = { 'test-drive': 'Essai', visit: 'Passage en agence', delivery: 'Livraison' }

const REQ = '/admin/collections/requests'
const APPT = '/admin/collections/appointments'
const CARS = '/admin/collections/vehicles'

const HOUR = 3_600_000
const DAY = 24 * HOUR
const iso = (ms: number) => new Date(ms).toISOString()
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n > 1 ? many : one}`
const tel = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`
const fmtTime = (s: string) => new Date(s).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
const fmtDay = (ms: number) => new Date(ms).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' })
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

const age = (s: string) => {
  const hours = Math.max(0, Math.floor((Date.now() - new Date(s).getTime()) / HOUR))
  if (hours < 1) return 'à l’instant'
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.floor(hours / 24)
  return days < 30 ? `il y a ${days} j` : `il y a ${Math.floor(days / 30)} mois`
}

const duration = (hours: number) => (hours < 1 ? `${Math.max(1, Math.round(hours * 60))} min` : hours < 48 ? `${Math.round(hours)} h` : `${Math.round(hours / 24)} j`)

const contextLine = (r: Request) => {
  const bits: string[] = [TYPE_LABELS[r.type]]
  if (r.vehicle && typeof r.vehicle === 'object') bits.push(r.vehicle.title)
  else if (r.tradeIn?.brand) bits.push([r.tradeIn.brand, r.tradeIn.model].filter(Boolean).join(' '))
  if (r.formula) bits.push(FORMULA[r.formula] ?? r.formula)
  if (r.reference) bits.push(r.reference)
  return bits.filter(Boolean).join(' · ')
}

const ownerName = (r: Request) => (r.assignedTo && typeof r.assignedTo === 'object' ? r.assignedTo.name : null)

/** ADM-01 : tableau de bord commercial et administrateur. Toutes les dates sont calculées à l'heure de Paris. */
export async function Dashboard() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await nextHeaders() })
  if (!user || !('role' in user)) return null
  const isAdmin = user.role === 'admin'
  const firstName = typeof user.name === 'string' ? user.name.split(' ')[0] : ''

  const now = Date.now()
  const p = parisNow(now)
  const dayStart = parisTime(p.y, p.m, p.d, 0, 0)
  const dayEnd = parisTime(p.y, p.m, p.d + 1, 0, 0)
  const weekStart = parisTime(p.y, p.m, p.d - (p.weekday === 0 ? 6 : p.weekday - 1), 0, 0)
  const monthStart = parisTime(p.y, p.m, 1, 0, 0)
  const chartStart = parisTime(p.y, p.m, p.d - 13, 0, 0)
  const prevStart = parisTime(p.y, p.m, p.d - 27, 0, 0)
  const windowStart = Math.min(monthStart, prevStart, now - 30 * DAY)

  const settings = await payload.findGlobal({ slug: 'settings', depth: 0 })
  const staleHours = settings.retention?.internalReminderHours ?? 24
  const staleSince = iso(now - staleHours * HOUR)

  const working = { status: { in: ['review', 'approved'] } }
  const mineWhere = isAdmin ? working : { and: [working, { assignedTo: { equals: user.id } }] }
  const none = Promise.resolve({ totalDocs: 0, docs: [] as never[] })

  const [
    toTake, inProgress, stale, missing,
    appts, overdue, recent,
    available, reserved, drafts, soldMonth,
    statusCounts, assigned, team, subscribers,
  ] = await Promise.all([
    payload.find({ collection: 'requests', where: { status: { equals: 'new' } }, sort: 'createdAt', limit: 6, depth: 1 }),
    payload.find({ collection: 'requests', where: mineWhere, sort: 'updatedAt', limit: 6, depth: 1 }),
    payload.count({ collection: 'requests', where: { and: [{ status: { equals: 'new' } }, { createdAt: { less_than: staleSince } }] } }),
    payload.count({ collection: 'requests', where: { and: [{ type: { equals: 'financing' } }, { missingDocuments: { equals: true } }, { status: { in: ['new', 'review'] } }] } }),
    payload.find({
      collection: 'appointments',
      where: { and: [{ status: { equals: 'confirmed' } }, { startsAt: { greater_than_equal: iso(dayStart) } }, { startsAt: { less_than: iso(dayStart + 7 * DAY) } }] },
      sort: 'startsAt',
      limit: 30,
      depth: 1,
    }),
    payload.find({ collection: 'appointments', where: { and: [{ status: { equals: 'confirmed' } }, { startsAt: { less_than: iso(dayStart) } }] }, sort: '-startsAt', limit: 5, depth: 1 }),
    payload.find({
      collection: 'requests',
      where: { createdAt: { greater_than_equal: iso(windowStart) } },
      limit: 2000,
      depth: 0,
      pagination: false,
      select: { createdAt: true, type: true, status: true, history: true },
    }),
    payload.count({ collection: 'vehicles', where: { and: [{ _status: { equals: 'published' } }, { status: { equals: 'available' } }] } }),
    payload.count({ collection: 'vehicles', where: { status: { equals: 'reserved' } } }),
    payload.count({ collection: 'vehicles', where: { _status: { equals: 'draft' } } }),
    payload.count({ collection: 'vehicles', where: { and: [{ status: { equals: 'sold' } }, { soldAt: { greater_than_equal: iso(monthStart) } }] } }),
    Promise.all(STATUS.map((s) => payload.count({ collection: 'requests', where: { status: { equals: s.key } } }))),
    isAdmin
      ? payload.find({ collection: 'requests', where: { and: [{ status: { in: ['new', 'review', 'approved'] } }, { assignedTo: { exists: true } }] }, limit: 1000, depth: 0, pagination: false, select: { assignedTo: true } })
      : none,
    isAdmin ? payload.find({ collection: 'users', limit: 50, depth: 0, sort: 'name', overrideAccess: true }) : none,
    isAdmin ? payload.count({ collection: 'subscribers' }) : none,
  ])

  /* ── Chiffres dérivés ── */
  const fresh = statusCounts[0].totalDocs
  const created = (r: { createdAt: string }) => new Date(r.createdAt).getTime()
  const todayAppts = appts.docs.filter((a) => new Date(a.startsAt).getTime() < dayEnd)
  const weekCount = recent.docs.filter((r) => created(r) >= weekStart).length
  const monthCount = recent.docs.filter((r) => created(r) >= monthStart).length

  const perDay = Array.from({ length: 14 }, (_, i) => {
    const from = parisTime(p.y, p.m, p.d - 13 + i, 0, 0)
    const to = parisTime(p.y, p.m, p.d - 12 + i, 0, 0)
    return { from, count: recent.docs.filter((r) => created(r) >= from && created(r) < to).length }
  })
  const chartTotal = perDay.reduce((s, d) => s + d.count, 0)
  const prevTotal = recent.docs.filter((r) => created(r) >= prevStart && created(r) < chartStart).length
  const chartMax = Math.max(4, ...perDay.map((d) => d.count))
  const trend = chartTotal - prevTotal

  const last30 = recent.docs.filter((r) => created(r) >= now - 30 * DAY)
  const byType = (Object.keys(TYPE_LABELS) as Request['type'][]).map((t) => ({ t, n: last30.filter((r) => r.type === t).length }))
  const byTypeMax = Math.max(1, ...byType.map((b) => b.n))
  const decided = last30.filter((r) => ['approved', 'delivered', 'refused'].includes(r.status))
  const approvalRate = decided.length ? Math.round((decided.filter((r) => r.status !== 'refused').length / decided.length) * 100) : null
  const firstReplies = last30.flatMap((r) => {
    const first = r.history?.find((h) => h.status && h.status !== 'new' && h.at)
    return first?.at ? [(new Date(first.at).getTime() - created(r)) / HOUR] : []
  })
  const avgReply = firstReplies.length ? firstReplies.reduce((s, h) => s + h, 0) / firstReplies.length : null

  const statusTotal = statusCounts.reduce((s, c) => s + c.totalDocs, 0)
  const load = new Map<number, number>()
  for (const r of assigned.docs as Request[]) {
    const id = typeof r.assignedTo === 'object' ? r.assignedTo?.id : r.assignedTo
    if (id) load.set(id, (load.get(id) ?? 0) + 1)
  }

  const days = new Map<number, Appointment[]>()
  if (overdue.docs.length) days.set(-1, [...overdue.docs].reverse())
  for (const a of appts.docs) {
    const t = new Date(a.startsAt).getTime()
    let key = 0
    while (key < 7 && parisTime(p.y, p.m, p.d + key + 1, 0, 0) <= t) key++
    days.set(key, [...(days.get(key) ?? []), a])
  }
  const dayLabel = (offset: number) =>
    offset === -1
      ? `À clôturer${overdue.totalDocs > overdue.docs.length ? ` (${overdue.docs.length} sur ${overdue.totalDocs})` : ''}`
      : offset === 0
        ? 'Aujourd’hui'
        : offset === 1
          ? 'Demain'
          : fmtDay(parisTime(p.y, p.m, p.d + offset, 12, 0))

  const greeting = p.hour >= 5 && p.hour < 18 ? 'Bonjour' : 'Bonsoir'
  const inProgressHref = isAdmin ? `${REQ}?where[status][in]=review,approved` : `${REQ}?where[assignedTo][equals]=${user.id}&where[status][in]=review,approved`

  const alerts = [
    stale.totalDocs > 0 && {
      tone: 'red',
      icon: 'clock',
      href: `${REQ}?where[status][equals]=new&where[createdAt][less_than]=${staleSince}&sort=createdAt`,
      title: `${plural(stale.totalDocs, 'demande')} sans réponse depuis plus de ${staleHours} h`,
      text: 'Le client attend un premier appel.',
    },
    overdue.totalDocs > 0 && {
      tone: 'red',
      icon: 'calendar',
      href: `${APPT}?where[status][equals]=confirmed&where[startsAt][less_than]=${iso(dayStart)}`,
      title: `${plural(overdue.totalDocs, 'rendez-vous passé', 'rendez-vous passés')} à clôturer`,
      text: 'Indiquez s’ils ont été honorés ou non.',
    },
    missing.totalDocs > 0 && {
      tone: 'navy',
      icon: 'file',
      href: `${REQ}?where[missingDocuments][equals]=true&where[status][in]=new,review`,
      title: plural(missing.totalDocs, 'dossier incomplet', 'dossiers incomplets'),
      text: 'Justificatifs attendus, relances automatiques à 48 h et 5 j.',
    },
  ].filter((a) => a !== false)

  return (
    <div className="la-board">
      {/* ── En-tête ── */}
      <header className="la-head">
        <div>
          <span className="la-filet" />
          <p className="la-eyebrow">Tableau de bord</p>
          <h2 className="la-title">{firstName ? `${greeting} ${firstName}` : greeting}</h2>
          <p className="la-sub">
            <span className="la-date">{fmtDay(now)}</span> · {isAdmin ? 'Poste administrateur' : 'Poste commercial'}
          </p>
        </div>
        <div className="la-head-side">
          <a className="la-cta la-cta--ghost" href={`${REQ}?sort=-createdAt`}>Toutes les demandes</a>
          {isAdmin && (
            <a className="la-cta" href={`${CARS}/create`}>
              <Icon name="plus" /> Ajouter un véhicule
            </a>
          )}
        </div>
      </header>

      {/* ── Chiffres du jour ── */}
      <div className="la-kpis">
        <Kpi icon="inbox" label="À prendre" value={fresh} hint={stale.totalDocs ? `dont ${stale.totalDocs} en retard` : 'nouvelles demandes'} href={`${REQ}?where[status][equals]=new&sort=createdAt`} tone={fresh ? 'red' : undefined} />
        <Kpi icon="folder" label={isAdmin ? 'Dossiers en cours' : 'Mes dossiers'} value={inProgress.totalDocs} hint="en étude ou accordés" href={inProgressHref} />
        <Kpi icon="calendar" label="Rendez-vous" value={todayAppts.length} hint={`aujourd’hui · ${appts.totalDocs} sur 7 jours`} href={`${APPT}?where[status][equals]=confirmed&sort=startsAt`} />
        <Kpi icon="trend" label="Cette semaine" value={weekCount} hint={`demandes reçues · ${monthCount} ce mois`} href={`${REQ}?sort=-createdAt`} />
      </div>

      {alerts.length > 0 && (
        <div className="la-alerts">
          {alerts.map((a) => (
            <a key={a.title} className={`la-alert la-alert--${a.tone}`} href={a.href}>
              <span className="la-alert-icon"><Icon name={a.icon} /></span>
              <span className="la-alert-body">
                <strong>{a.title}</strong>
                <span>{a.text}</span>
              </span>
              <Icon name="chevron" className="la-alert-go" />
            </a>
          ))}
        </div>
      )}

      {/* ── Suivi des demandes ── */}
      <Section title="Suivi des demandes">
        <Card
          span={8}
          title="À prendre"
          count={toTake.totalDocs}
          hot={toTake.totalDocs > 0}
          link={{ href: `${REQ}?where[status][equals]=new&sort=createdAt`, label: toTake.totalDocs > toTake.docs.length ? `Voir les ${toTake.totalDocs}` : 'Tout voir' }}
          flush
        >
          {toTake.docs.length === 0 ? (
            <Empty icon="check" text="Toutes les demandes ont été prises en charge." />
          ) : (
            <ul className="la-list">
              {toTake.docs.map((r) => (
                <RequestRow key={r.id} r={r} late={created(r) < now - staleHours * HOUR} />
              ))}
            </ul>
          )}
        </Card>

        <Card span={4} tall title="Agenda" count={appts.totalDocs + overdue.totalDocs} link={{ href: `${APPT}?where[status][equals]=confirmed&sort=startsAt`, label: 'Tout voir' }}>
          {days.size === 0 ? (
            <Empty icon="calendar" text="Aucun rendez-vous dans les 7 prochains jours." />
          ) : (
            [...days.entries()].map(([offset, list]) => (
              <div className="la-day" key={offset}>
                <p className={`la-day-label${offset === -1 ? ' la-day-label--late' : ''}`}>{dayLabel(offset)}</p>
                {list.map((a) => {
                  const past = new Date(a.startsAt).getTime() < now
                  const when = offset === -1 ? new Date(a.startsAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Europe/Paris' }) : fmtTime(a.startsAt)
                  const vehicle = a.vehicle && typeof a.vehicle === 'object' ? a.vehicle.title : null
                  return (
                    <div key={a.id} className={`la-appt${past ? ' la-appt--past' : ''}`}>
                      <span className="la-appt-time">{when}</span>
                      <div className="la-appt-body">
                        <a className="la-appt-name" href={`${APPT}/${a.id}`}>
                          <strong>{a.name}</strong>
                          <span className="la-tag">{KIND_LABELS[a.kind]}</span>
                        </a>
                        {vehicle && <span className="la-row-meta">{vehicle}</span>}
                        <div className="la-appt-actions">
                          <a className="la-phone" href={tel(a.phone)}><Icon name="phone" />{a.phone}</a>
                          {past && <DashAction id={a.id} kind="done" label="Honoré" tone="ghost" />}
                          <DashAction id={a.id} kind="cancel" label={past ? 'Pas venu' : 'Annuler'} tone="ghost" confirm={past ? undefined : `Annuler le rendez-vous de ${a.name} ? Prévenez le client par téléphone.`} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </Card>

        <Card
          span={8}
          title={isAdmin ? 'Dossiers en cours' : 'Mes dossiers'}
          count={inProgress.totalDocs}
          link={{ href: inProgressHref, label: inProgress.totalDocs > inProgress.docs.length ? `Voir les ${inProgress.totalDocs}` : 'Tout voir' }}
          flush
        >
          {inProgress.docs.length === 0 ? (
            <Empty icon="folder" text={isAdmin ? 'Aucun dossier en étude ou accordé.' : 'Aucun dossier en cours. Prenez une demande ci-dessus.'} />
          ) : (
            <ul className="la-list">
              {inProgress.docs.map((r) => (
                <RequestRow key={r.id} r={r} owner={isAdmin ? (ownerName(r) ?? 'Non attribué') : null} />
              ))}
            </ul>
          )}
        </Card>
      </Section>

      {/* ── Activité ── */}
      <Section title="Activité">
        <Card span={8} title="Demandes reçues" note="14 derniers jours">
          <div className="la-chart-head">
            <span className="la-big">{chartTotal}</span>
            <span className={`la-trend${trend > 0 ? ' la-trend--up' : trend < 0 ? ' la-trend--down' : ''}`}>
              {trend === 0 ? 'Stable' : `${trend > 0 ? '+' : '−'}${Math.abs(trend)}`} par rapport aux 14 jours précédents
            </span>
          </div>
          <div className="la-chart" role="img" aria-label={`Demandes reçues par jour : ${perDay.map((d) => `${fmtDay(d.from + 12 * HOUR)} ${d.count}`).join(', ')}`}>
            <div className="la-chart-grid" aria-hidden>
              <span>{chartMax}</span>
              <span>{Math.round(chartMax / 2)}</span>
              <span>0</span>
            </div>
            <div className="la-bars">
              {perDay.map((d, i) => (
                <div key={d.from} className={`la-bar${i === 13 ? ' la-bar--today' : ''}`} title={`${fmtDay(d.from + 12 * HOUR)} : ${plural(d.count, 'demande')}`}>
                  {d.count > 0 && <span style={{ height: `${(d.count / chartMax) * 100}%` }} />}
                </div>
              ))}
            </div>
          </div>
          <div className="la-axis" aria-hidden>
            {perDay.map((d, i) => (
              <span key={d.from}>{i === 13 ? <b>Auj.</b> : i % 2 === 1 ? new Date(d.from + 12 * HOUR).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Paris' }) : ''}</span>
            ))}
          </div>
        </Card>

        <Card span={4} title="Performance" note="30 derniers jours">
          <div className="la-metrics">
            <a className="la-metric" href={`${REQ}?where[status][in]=approved,delivered,refused`}>
              <span className="la-metric-label">Taux d’accord</span>
              <span className="la-metric-value">{approvalRate == null ? '–' : `${approvalRate} %`}</span>
              <span className="la-metric-hint">sur {plural(decided.length, 'dossier tranché', 'dossiers tranchés')}</span>
            </a>
            <div className="la-metric">
              <span className="la-metric-label">1re réponse</span>
              <span className="la-metric-value">{avgReply == null ? '–' : duration(avgReply)}</span>
              <span className="la-metric-hint">délai moyen</span>
            </div>
          </div>
          <p className="la-subhead">Par type de demande</p>
          <div className="la-hbars">
            {byType.map(({ t, n }) => (
              <a key={t} className="la-hbar-row" href={`${REQ}?where[type][equals]=${t}&sort=-createdAt`}>
                <span>{TYPE_LABELS[t]}</span>
                <span className="la-hbar-track"><span style={{ width: `${(n / byTypeMax) * 100}%` }} /></span>
                <b>{n}</b>
              </a>
            ))}
          </div>
        </Card>

        <Card span={8} title="Répartition par statut" note={plural(statusTotal, 'demande')}>
          <div className="la-seg" role="img" aria-label={STATUS.map((s, i) => `${s.label} ${statusCounts[i].totalDocs}`).join(', ')}>
            {STATUS.map((s, i) => statusCounts[i].totalDocs > 0 && <span key={s.key} title={`${s.label} : ${statusCounts[i].totalDocs}`} style={{ flex: statusCounts[i].totalDocs, background: s.color }} />)}
          </div>
          <div className="la-pipeline">
            {STATUS.map((s, i) => {
              const n = statusCounts[i].totalDocs
              return (
                <a key={s.key} className="la-pipe" href={`${REQ}?where[status][equals]=${s.key}`}>
                  <span className="la-pipe-label"><span className="la-dot" style={{ background: s.color }} />{s.label}</span>
                  <span className="la-pipe-value">{n}</span>
                  <span className="la-pipe-share">{statusTotal ? `${Math.round((n / statusTotal) * 100)} %` : '–'}</span>
                </a>
              )
            })}
          </div>
        </Card>

        <Card span={4} title="Stock" link={{ href: CARS, label: 'Voir le stock' }}>
          <div className="la-stats">
            <Stat value={available.totalDocs} label="En ligne" href={`${CARS}?where[status][equals]=available&where[_status][equals]=published`} />
            <Stat value={reserved.totalDocs} label="Réservés" href={`${CARS}?where[status][equals]=reserved`} />
            <Stat value={soldMonth.totalDocs} label="Vendus ce mois" href={`${CARS}?where[status][equals]=sold&where[soldAt][greater_than_equal]=${iso(monthStart)}&sort=-soldAt`} />
            <Stat value={drafts.totalDocs} label="Brouillons" href={`${CARS}?where[_status][equals]=draft`} />
          </div>
        </Card>
      </Section>

      {/* ── Administration ── */}
      {isAdmin && (
        <Section title="Administration">
          <Card span={4} title="Équipe" count={team.docs.length} link={{ href: '/admin/collections/users', label: 'Gérer' }} flush>
            <ul className="la-list">
              {team.docs.map((u) => (
                <li key={u.id} className="la-line">
                  <span className="la-avatar la-avatar--sm">{initials(u.name || '?')}</span>
                  <span className="la-line-main">
                    <strong>{u.name}</strong>
                    <span className="la-row-meta">
                      {u.role === 'admin' ? 'Administrateur' : 'Commercial'}
                      {u.disabled ? ' · accès coupé' : ''}
                    </span>
                  </span>
                  <a className="la-line-side" href={`${REQ}?where[assignedTo][equals]=${u.id}&where[status][in]=new,review,approved`}>
                    {plural(load.get(u.id) ?? 0, 'dossier', 'dossiers')}
                  </a>
                </li>
              ))}
            </ul>
          </Card>

          <Card span={4} title="Mise en service" flush>
            <ul className="la-list">
              <Service ok={Boolean(process.env.RESEND_API_KEY)} name="E-mails (Resend)" on={`Envoi depuis ${process.env.EMAIL_FROM || 'contact@lease-auto.fr'}`} off="Les e-mails ne partent pas. Ajoutez RESEND_API_KEY." />
              <Service ok={Boolean(process.env.AUTH0_DOMAIN && process.env.AUTH0_CLIENT_ID)} name="Connexion équipe (Auth0)" on="Connexion sécurisée active" off="Comptes de démo locaux uniquement. Ajoutez les clés AUTH0_*." />
              <Service ok={Boolean(process.env.BLOB_READ_WRITE_TOKEN)} name="Fichiers (Vercel Blob)" on="Photos et justificatifs stockés en ligne" off="Fichiers sur le disque local. Ajoutez BLOB_READ_WRITE_TOKEN." />
              <Service ok={Boolean(process.env.CRON_SECRET)} name="Automatisations" on="Relances et rappels toutes les heures" off="Ajoutez CRON_SECRET pour activer les relances." />
            </ul>
          </Card>

          <Card span={4} title="Raccourcis" flush>
            <ul className="la-list">
              <Shortcut icon="users" label="Abonnés" side={String(subscribers.totalDocs)} href="/admin/collections/subscribers" />
              <Shortcut icon="mail" label="Nouvelle newsletter" href="/admin/collections/campaigns/create" />
              <Shortcut icon="calendar" label="Horaires de l’agenda" href="/admin/globals/agenda" />
              <Shortcut icon="home" label="Page d’accueil" href="/admin/globals/homepage" />
              <Shortcut icon="sliders" label="Réglages" href="/admin/globals/settings" />
            </ul>
          </Card>
        </Section>
      )}
    </div>
  )
}

/* ── Composants ── */

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="la-section">
      <h3 className="la-section-title">{title}</h3>
      <div className="la-grid">{children}</div>
    </section>
  )
}

function Card({
  span,
  tall = false,
  title,
  count,
  hot = false,
  note,
  link,
  flush = false,
  children,
}: {
  span: 4 | 8
  tall?: boolean
  title: string
  count?: number
  hot?: boolean
  note?: string
  link?: { href: string; label: string }
  flush?: boolean
  children: ReactNode
}) {
  return (
    <div className={`la-card la-s${span}${tall ? ' la-tall' : ''}${flush ? ' la-card--flush' : ''}`}>
      <div className="la-card-head">
        <div className="la-card-heading">
          <h4 className="la-card-title">{title}</h4>
          {count != null && <span className={`la-count${hot ? ' la-count--hot' : ''}`}>{count}</span>}
          {note && <span className="la-card-note">{note}</span>}
        </div>
        {link && (
          <a className="la-more" href={link.href}>
            {link.label}
            <Icon name="chevron" />
          </a>
        )}
      </div>
      <div className="la-card-body">{children}</div>
    </div>
  )
}

function RequestRow({ r, late = false, owner = null }: { r: Request; late?: boolean; owner?: string | null }) {
  const [label, tone] = STATUS_TAG[r.status]
  return (
    <li className="la-row">
      <a className="la-row-main" href={`${REQ}/${r.id}`}>
        <span className={`la-avatar${r.status === 'new' ? ' la-avatar--red' : ''}`}>{initials(`${r.firstName} ${r.lastName}`)}</span>
        <span className="la-row-body">
          <span className="la-row-top">
            <strong>{r.firstName} {r.lastName}</strong>
            <span className={`la-tag ${tone}`}>{label}</span>
            {late && <span className="la-tag la-tag--warn">En retard</span>}
            {r.type === 'financing' && r.missingDocuments && r.status !== 'approved' && <span className="la-tag la-tag--line">Pièces manquantes</span>}
          </span>
          <span className="la-row-meta">{contextLine(r)}</span>
          <span className="la-row-age">
            Reçue {age(r.createdAt)}
            {owner ? ` · suivie par ${owner}` : ''}
          </span>
        </span>
      </a>
      <span className="la-row-actions">
        <a className="la-phone" href={tel(r.phone)}><Icon name="phone" />{r.phone}</a>
        {r.status === 'new' && <DashAction id={r.id} kind="advance" label="Prendre en charge" />}
        {r.status === 'review' && <DashAction id={r.id} kind="advance" label="Accorder" confirm={`Confirmer l’accord pour ${r.firstName} ${r.lastName} ? Le client reçoit un e-mail.`} />}
        {r.status === 'approved' && <DashAction id={r.id} kind="advance" label="Marquer livrée" confirm={`Le véhicule de ${r.firstName} ${r.lastName} a été livré ? Le client reçoit un e-mail, puis une demande d’avis.`} />}
        {(r.status === 'new' || r.status === 'review') && (
          <DashAction id={r.id} kind="refuse" label="Refuser" tone="ghost" confirm={`Refuser la demande de ${r.firstName} ${r.lastName} ? Le client est prévenu par e-mail.`} />
        )}
      </span>
    </li>
  )
}

function Kpi({ icon, label, value, hint, href, tone }: { icon: IconName; label: string; value: number; hint: string; href: string; tone?: 'red' }) {
  return (
    <a className={`la-kpi${tone ? ` la-kpi--${tone}` : ''}`} href={href}>
      <span className="la-kpi-top">
        <span className="la-kpi-label">{label}</span>
        <span className="la-kpi-icon"><Icon name={icon} /></span>
      </span>
      <span className="la-kpi-value">{value}</span>
      <span className="la-kpi-hint">{hint}</span>
    </a>
  )
}

function Stat({ value, label, href }: { value: number; label: string; href: string }) {
  return (
    <a className="la-stat" href={href}>
      <span className="la-stat-value">{value}</span>
      <span className="la-stat-label">{label}</span>
    </a>
  )
}

function Empty({ icon, text }: { icon: IconName; text: string }) {
  return (
    <div className="la-empty">
      <span className="la-empty-icon"><Icon name={icon} /></span>
      <p>{text}</p>
    </div>
  )
}

function Service({ ok, name, on, off }: { ok: boolean; name: string; on: string; off: string }) {
  return (
    <li className="la-line">
      <span className={`la-status-dot${ok ? ' la-status-dot--ok' : ''}`} />
      <span className="la-line-main">
        <strong>{name}</strong>
        <span className="la-row-meta la-row-meta--wrap">{ok ? on : off}</span>
      </span>
      <span className={`la-tag ${ok ? 'la-tag--green' : 'la-tag--warn'}`}>{ok ? 'Actif' : 'À configurer'}</span>
    </li>
  )
}

function Shortcut({ icon, label, href, side }: { icon: IconName; label: string; href: string; side?: string }) {
  return (
    <li>
      <a className="la-line la-line--link" href={href}>
        <span className="la-line-icon"><Icon name={icon} /></span>
        <span className="la-line-main"><strong>{label}</strong></span>
        {side && <span className="la-count">{side}</span>}
        <Icon name="chevron" className="la-line-go" />
      </a>
    </li>
  )
}

/* Pictogrammes au trait (24 × 24), dessinés pour l'admin. */
const ICONS = {
  inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z',
  folder: 'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z',
  calendar: 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM16 2v4M8 2v4M3 10h18',
  trend: 'M22 7l-8.5 8.5-5-5L2 17M16 7h6v6',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h4',
  check: 'M20 6 9 17l-5-5',
  chevron: 'm9 18 6-6-6-6',
  plus: 'M12 5v14M5 12h14',
  phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 7l-10 6L2 7',
  home: 'm3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10',
  sliders: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
} as const
type IconName = keyof typeof ICONS

function Icon({ name, className }: { name: IconName | string; className?: string }) {
  return (
    <svg className={`la-icon${className ? ` ${className}` : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={ICONS[name as IconName]} />
    </svg>
  )
}
