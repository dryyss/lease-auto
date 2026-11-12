import config from '@payload-config'
import { Link } from '@payloadcms/ui'
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
  { key: 'delivered', label: 'Livrées', color: '#5b84c4' },
  { key: 'refused', label: 'Refus', color: '#c5cedd' },
]
const STATUS_TAG: Record<Request['status'], [string, string]> = {
  new: ['Nouvelle', 'la-tag--red'],
  review: ['En étude', 'la-tag--navy'],
  approved: ['Accord', 'la-tag--green'],
  delivered: ['Livrée', ''],
  refused: ['Refus', ''],
}
const FORMULA: Record<string, string> = { loa: 'LOA', lld: 'LLD', credit: 'Crédit' }
const KIND_LABELS: Record<Appointment['kind'], string> = { 'test-drive': 'Essai', visit: 'Passage', delivery: 'Livraison' }

/** E-mails branchés (Resend) : sinon les confirmations ne promettent pas d’e-mail au client. */
const MAIL = Boolean(process.env.RESEND_API_KEY)
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

/** Ce que le client veut, en une ligne : type, véhicule ou reprise, formule. La référence est affichée à part. */
const contextLine = (r: Request) => {
  const bits: string[] = [TYPE_LABELS[r.type]]
  if (r.vehicle && typeof r.vehicle === 'object') bits.push(r.vehicle.title)
  else if (r.tradeIn?.brand) bits.push([r.tradeIn.brand, r.tradeIn.model].filter(Boolean).join(' '))
  if (r.formula) bits.push(FORMULA[r.formula] ?? r.formula)
  return bits.filter(Boolean).join(' · ')
}

const ownerName = (r: Request) => (r.assignedTo && typeof r.assignedTo === 'object' ? r.assignedTo.name : null)

/**
 * ADM-01 : tableau de bord commercial et administrateur. Toutes les dates sont calculées à l'heure de Paris.
 * Organisation : en haut les chiffres de l'activité, puis à gauche le travail à faire (priorités, demandes, dossiers),
 * à droite le planning et le suivi. Le rouge est réservé à l'urgence et à l'action principale de la page.
 */
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
    statusCounts, assigned, team,
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
  ])

  /* ── Chiffres dérivés ── */
  const created = (r: { createdAt: string }) => new Date(r.createdAt).getTime()
  const todayCount = appts.docs.filter((a) => new Date(a.startsAt).getTime() < dayEnd).length

  const perDay = Array.from({ length: 14 }, (_, i) => {
    const from = parisTime(p.y, p.m, p.d - 13 + i, 0, 0)
    const to = parisTime(p.y, p.m, p.d - 12 + i, 0, 0)
    return { from, count: recent.docs.filter((r) => created(r) >= from && created(r) < to).length }
  })
  const chartTotal = perDay.reduce((s, d) => s + d.count, 0)
  const prevTotal = recent.docs.filter((r) => created(r) >= prevStart && created(r) < chartStart).length
  const chartMax = Math.max(1, ...perDay.map((d) => d.count))
  const trend = chartTotal - prevTotal

  const last30 = recent.docs.filter((r) => created(r) >= now - 30 * DAY)
  const byType = (Object.keys(TYPE_LABELS) as Request['type'][]).map((t) => ({ t, n: last30.filter((r) => r.type === t).length }))
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
    offset === -1 ? 'À clôturer' : offset === 0 ? 'Aujourd’hui' : offset === 1 ? 'Demain' : fmtDay(parisTime(p.y, p.m, p.d + offset, 12, 0))

  const greeting = p.hour >= 5 && p.hour < 18 ? 'Bonjour' : 'Bonsoir'
  const inProgressHref = isAdmin ? `${REQ}?where[status][in]=review,approved` : `${REQ}?where[assignedTo][equals]=${user.id}&where[status][in]=review,approved`
  const newHref = `${REQ}?where[status][equals]=new&sort=createdAt`

  // Variables : RESEND_API_KEY, AUTH0_*, BLOB_READ_WRITE_TOKEN, CRON_SECRET (le détail technique reste ici, pas à l'écran).
  const services = [
    { ok: Boolean(process.env.RESEND_API_KEY), name: 'envoi des e-mails' },
    { ok: Boolean(process.env.AUTH0_DOMAIN && process.env.AUTH0_CLIENT_ID), name: 'connexion de l’équipe' },
    { ok: Boolean(process.env.BLOB_READ_WRITE_TOKEN), name: 'stockage des fichiers' },
    { ok: Boolean(process.env.CRON_SECRET), name: 'relances automatiques' },
  ].filter((s) => !s.ok)

  const priorities: { tone: 'red' | 'amber' | 'grey'; icon: IconName; href?: string; title: string; text: string }[] = [
    stale.totalDocs > 0 && {
      tone: 'red' as const,
      icon: 'clock' as const,
      href: `${REQ}?where[status][equals]=new&where[createdAt][less_than]=${staleSince}&sort=createdAt`,
      title: `${plural(stale.totalDocs, 'demande')} sans réponse depuis plus de ${staleHours} h`,
      text: 'Le client attend un premier appel.',
    },
    overdue.totalDocs > 0 && {
      tone: 'red' as const,
      icon: 'calendar' as const,
      href: `${APPT}?where[status][equals]=confirmed&where[startsAt][less_than]=${iso(dayStart)}`,
      title: `${plural(overdue.totalDocs, 'rendez-vous passé', 'rendez-vous passés')} à clôturer`,
      text: 'Indiquez s’ils ont été honorés ou non.',
    },
    missing.totalDocs > 0 && {
      tone: 'amber' as const,
      icon: 'file' as const,
      href: `${REQ}?where[missingDocuments][equals]=true&where[status][in]=new,review`,
      title: plural(missing.totalDocs, 'dossier incomplet', 'dossiers incomplets'),
      text: 'Justificatifs attendus. Relances automatiques à 48 h et 5 jours.',
    },
    isAdmin &&
      services.length > 0 && {
        tone: 'grey' as const,
        icon: 'sliders' as const,
        title: `${plural(services.length, 'réglage technique', 'réglages techniques')} à terminer`,
        text: `${services.map((s) => s.name).join(', ').replace(/^./, (c) => c.toUpperCase())}. À voir avec le développeur.`,
      },
  ].filter((x) => x !== false)

  return (
    <div className="la-board">
      {/* ── En-tête : le fil d'Ariane de Payload dit déjà « Tableau de bord », pas de surtitre. ── */}
      <header className="la-head">
        <div>
          <h2 className="la-title">{firstName ? `${greeting} ${firstName}` : greeting}</h2>
          <p className="la-sub">
            <span className="la-date">{fmtDay(now)}</span>
            <span aria-hidden> · </span>
            {plural(toTake.totalDocs, 'demande', 'demandes')} à prendre, {plural(todayCount, 'rendez-vous', 'rendez-vous')} aujourd’hui
          </p>
        </div>
        <div className="la-head-side">
          <Link className="la-cta la-cta--ghost" href={`${REQ}?sort=-createdAt`}>Toutes les demandes</Link>
          {isAdmin && (
            <Link className="la-cta" href={`${CARS}/create`}>
              <Icon name="plus" /> Ajouter un véhicule
            </Link>
          )}
        </div>
      </header>

      {/* ── Chiffres de l'activité (pas de doublon avec les listes ci-dessous) ── */}
      <section className="la-kpis" aria-label="Chiffres clés">
        <Link className="la-kpi" href={`${REQ}?sort=-createdAt`}>
          <span className="la-kpi-label">Demandes reçues</span>
          <span className="la-kpi-row">
            <span className="la-kpi-value">{chartTotal}</span>
            <span className={`la-delta${trend > 0 ? ' la-delta--up' : trend < 0 ? ' la-delta--down' : ''}`}>
              {trend === 0 ? '=' : `${trend > 0 ? '+' : '−'}${Math.abs(trend)}`}
            </span>
          </span>
          <span className="la-kpi-hint">14 derniers jours, contre {prevTotal} avant</span>
          <span className="la-spark" role="img" aria-label={`Par jour : ${perDay.map((d) => d.count).join(', ')}`}>
            {perDay.map((d, i) => (
              <span key={d.from} className={i === 13 ? 'la-spark-today' : undefined} style={{ height: `${Math.max(6, (d.count / chartMax) * 100)}%`, opacity: d.count ? 1 : 0.35 }} />
            ))}
          </span>
        </Link>
        <Link className="la-kpi" href={`${REQ}?where[status][in]=approved,delivered,refused`}>
          <span className="la-kpi-label">Taux d’accord</span>
          <span className="la-kpi-value">{approvalRate == null ? '–' : `${approvalRate} %`}</span>
          <span className="la-kpi-hint">{decided.length ? `sur ${plural(decided.length, 'dossier tranché', 'dossiers tranchés')}, 30 jours` : 'aucun dossier tranché sur 30 jours'}</span>
        </Link>
        <div className="la-kpi">
          <span className="la-kpi-label">Première réponse</span>
          <span className="la-kpi-value">{avgReply == null ? '–' : duration(avgReply)}</span>
          <span className="la-kpi-hint">délai moyen, 30 jours</span>
        </div>
        <Link className="la-kpi" href={`${CARS}?where[status][equals]=available&where[_status][equals]=published`}>
          <span className="la-kpi-label">Véhicules en ligne</span>
          <span className="la-kpi-value">{available.totalDocs}</span>
          <span className="la-kpi-hint">
            {plural(reserved.totalDocs, 'réservé', 'réservés')} · {plural(soldMonth.totalDocs, 'vendu', 'vendus')} ce mois · {plural(drafts.totalDocs, 'brouillon')}
          </span>
        </Link>
      </section>

      <div className="la-layout">
        {/* ── Colonne de travail ── */}
        <div className="la-col">
          {priorities.length > 0 && (
            <Card order={1} title="Priorités" count={priorities.length}>
              <ul className="la-list">
                {priorities.map((a) => {
                  const body = (
                    <>
                      <span className={`la-prio-icon la-prio-icon--${a.tone}`}><Icon name={a.icon} /></span>
                      <span className="la-line-main">
                        <strong>{a.title}</strong>
                        <span className="la-meta">{a.text}</span>
                      </span>
                      {a.href && <Icon name="chevron" className="la-go" />}
                    </>
                  )
                  return (
                    <li key={a.title}>
                      {a.href ? <Link className="la-line la-line--link" href={a.href}>{body}</Link> : <div className="la-line">{body}</div>}
                    </li>
                  )
                })}
              </ul>
            </Card>
          )}

          <Card
            order={2}
            title="Demandes à prendre"
            count={toTake.totalDocs}
            hot={toTake.totalDocs > 0}
            link={{ href: newHref, label: toTake.totalDocs > toTake.docs.length ? `Voir les ${toTake.totalDocs}` : 'Tout voir' }}
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

          <Card
            order={4}
            title={isAdmin ? 'Dossiers en cours' : 'Mes dossiers'}
            count={inProgress.totalDocs}
            link={{ href: inProgressHref, label: inProgress.totalDocs > inProgress.docs.length ? `Voir les ${inProgress.totalDocs}` : 'Tout voir' }}
          >
            {inProgress.docs.length === 0 ? (
              <Empty icon="folder" text={isAdmin ? 'Aucun dossier en étude ou accordé.' : 'Aucun dossier en cours. Prenez une demande ci-dessus.'} />
            ) : (
              <ul className="la-list">
                {inProgress.docs.map((r) => (
                  <RequestRow key={r.id} r={r} showStatus owner={isAdmin ? (ownerName(r) ?? 'non attribué') : null} />
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* ── Colonne de suivi ── */}
        <div className="la-col">
          <Card order={3} title="Agenda" note="7 jours" count={appts.totalDocs + overdue.totalDocs} link={{ href: `${APPT}?where[status][equals]=confirmed&sort=startsAt`, label: 'Tout voir' }}>
            {days.size === 0 ? (
              <Empty icon="calendar" text="Aucun rendez-vous dans les 7 prochains jours." />
            ) : (
              <div className="la-agenda">
                {[...days.entries()].map(([offset, list]) => (
                  <section key={offset} className="la-day">
                    <h5 className={`la-day-label${offset === -1 ? ' la-day-label--late' : ''}`}>
                      {dayLabel(offset)}
                      {offset === -1 && overdue.totalDocs > overdue.docs.length && <span> · {overdue.docs.length} sur {overdue.totalDocs}</span>}
                    </h5>
                    <ul>
                      {list.map((a) => {
                        const past = new Date(a.startsAt).getTime() < now
                        const when = offset === -1 ? new Date(a.startsAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Europe/Paris' }) : fmtTime(a.startsAt)
                        const vehicle = a.vehicle && typeof a.vehicle === 'object' ? a.vehicle.title : null
                        return (
                          <li key={a.id} className={`la-appt${past && offset !== -1 ? ' la-appt--past' : ''}`}>
                            <span className="la-appt-time">{when}</span>
                            <div className="la-appt-body">
                              <Link className="la-appt-name" href={`${APPT}/${a.id}`}>
                                {a.name}
                                <span className="la-tag">{KIND_LABELS[a.kind]}</span>
                              </Link>
                              {vehicle && <span className="la-meta la-ellipsis">{vehicle}</span>}
                              <div className="la-appt-actions">
                                {/* Colonne étroite : téléphone en bouton, le numéro reste lisible au survol et par les lecteurs d'écran */}
                                <a className="la-icon-btn" href={tel(a.phone)} title={a.phone} aria-label={`Appeler ${a.name}, ${a.phone}`}><Icon name="phone" /></a>
                                {past && <DashAction id={a.id} kind="done" label="Honoré" tone="ghost" />}
                                <DashAction id={a.id} kind="cancel" label={past ? 'Pas venu' : 'Annuler'} tone="ghost" confirm={past ? undefined : `Annuler le rendez-vous de ${a.name} ? Prévenez le client par téléphone.`} />
                              </div>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </Card>

          <Card order={5} title="Demandes par statut" note={plural(statusTotal, 'demande')}>
            <div className="la-pad">
              <div className="la-seg" role="img" aria-label={STATUS.map((s, i) => `${s.label} ${statusCounts[i].totalDocs}`).join(', ')}>
                {STATUS.map((s, i) => statusCounts[i].totalDocs > 0 && <span key={s.key} style={{ flex: statusCounts[i].totalDocs, background: s.color }} />)}
              </div>
              <ul className="la-legend">
                {STATUS.map((s, i) => (
                  <li key={s.key}>
                    <Link href={`${REQ}?where[status][equals]=${s.key}`}>
                      <span className="la-dot" style={{ background: s.color }} />
                      <span className="la-legend-label">{s.label}</span>
                      <b>{statusCounts[i].totalDocs}</b>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="la-subhead">Par type, 30 derniers jours</p>
              <ul className="la-legend">
                {byType.map(({ t, n }) => (
                  <li key={t}>
                    <Link href={`${REQ}?where[type][equals]=${t}&sort=-createdAt`}>
                      <span className="la-legend-label">{TYPE_LABELS[t]}</span>
                      <b>{n}</b>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          {isAdmin && (
            <Card order={6} title="Équipe" count={team.docs.length} link={{ href: '/admin/collections/users', label: 'Gérer' }}>
              <ul className="la-list">
                {team.docs.map((u) => (
                  <li key={u.id}>
                    <Link className="la-line la-line--link" href={`${REQ}?where[assignedTo][equals]=${u.id}&where[status][in]=new,review,approved`}>
                      <span className="la-avatar">{initials(u.name || '?')}</span>
                      <span className="la-line-main">
                        <strong>{u.name}</strong>
                        <span className="la-meta">
                          {u.role === 'admin' ? 'Administrateur' : 'Commercial'}
                          {u.disabled ? ' · accès coupé' : ''}
                        </span>
                      </span>
                      <span className="la-line-side">{plural(load.get(u.id) ?? 0, 'dossier')}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Composants ── */

/** `order` : place de la carte quand les deux colonnes se fondent en une seule (écrans moyens et mobiles). */
function Card({
  order,
  title,
  count,
  hot = false,
  note,
  link,
  children,
}: {
  order: number
  title: string
  count?: number
  hot?: boolean
  note?: string
  link?: { href: string; label: string }
  children: ReactNode
}) {
  return (
    <section className="la-card" style={{ order }}>
      <header className="la-card-head">
        <h3 className="la-card-title">
          {title}
          {count != null && <span className={`la-count${hot ? ' la-count--hot' : ''}`}>{count}</span>}
          {note && <span className="la-card-note">{note}</span>}
        </h3>
        {link && (
          <Link className="la-more" href={link.href}>
            {link.label}
            <Icon name="chevron" />
          </Link>
        )}
      </header>
      {children}
    </section>
  )
}

function RequestRow({ r, late = false, showStatus = false, owner = null }: { r: Request; late?: boolean; showStatus?: boolean; owner?: string | null }) {
  const [label, tone] = STATUS_TAG[r.status]
  return (
    <li className="la-row">
      <Link className="la-row-main" href={`${REQ}/${r.id}`}>
        <span className="la-row-top">
          <strong className="la-row-name">{r.firstName} {r.lastName}</strong>
          {showStatus && <span className={`la-tag ${tone}`}>{label}</span>}
          {late && <span className="la-tag la-tag--red">En retard</span>}
          {r.type === 'financing' && r.missingDocuments && r.status !== 'approved' && <span className="la-tag la-tag--amber">Pièces manquantes</span>}
        </span>
        <span className="la-meta la-ellipsis">{contextLine(r)}</span>
        <span className="la-row-foot">
          Reçue {age(r.createdAt)}
          {owner ? ` · ${owner}` : ''}
          {r.reference ? ` · ${r.reference}` : ''}
        </span>
      </Link>
      <span className="la-row-actions">
        <a className="la-phone" href={tel(r.phone)}><Icon name="phone" />{r.phone}</a>
        <span className="la-row-btns">
        {r.status === 'new' && <DashAction id={r.id} kind="advance" label="Prendre en charge" />}
        {r.status === 'review' && <DashAction id={r.id} kind="advance" label="Accorder" confirm={`Confirmer l’accord pour ${r.firstName} ${r.lastName} ?${MAIL ? ' Le client reçoit un e-mail.' : ' Pensez à prévenir le client.'}`} />}
        {r.status === 'approved' && <DashAction id={r.id} kind="advance" label="Marquer livrée" confirm={`Le véhicule de ${r.firstName} ${r.lastName} a été livré ?${MAIL ? ' Le client reçoit un e-mail, puis une demande d’avis.' : ''}`} />}
        {(r.status === 'new' || r.status === 'review') && (
          <DashAction id={r.id} kind="refuse" label="Refuser" tone="ghost" confirm={`Refuser la demande de ${r.firstName} ${r.lastName} ?${MAIL ? ' Le client est prévenu par e-mail.' : ' Pensez à prévenir le client.'}`} />
        )}
        </span>
      </span>
    </li>
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

/* Pictogrammes au trait (24 × 24), dessinés pour l'admin. */
const ICONS = {
  folder: 'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z',
  calendar: 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM16 2v4M8 2v4M3 10h18',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h4',
  check: 'M20 6 9 17l-5-5',
  chevron: 'm9 18 6-6-6-6',
  plus: 'M12 5v14M5 12h14',
  phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z',
  sliders: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
} as const
type IconName = keyof typeof ICONS

function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg className={`la-icon${className ? ` ${className}` : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={ICONS[name]} />
    </svg>
  )
}
