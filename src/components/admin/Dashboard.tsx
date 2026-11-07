/* eslint-disable @next/next/no-html-link-for-pages -- Routes admin Payload (routeur interne, pas des pages Next) */
import config from '@payload-config'
import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'

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

const HOUR = 3_600_000
const DAY = 24 * HOUR
const iso = (ms: number) => new Date(ms).toISOString()
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n > 1 ? many : one}`
const tel = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`
const fmtTime = (s: string) => new Date(s).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
const fmtDay = (ms: number) => new Date(ms).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' })

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
  const windowStart = Math.min(monthStart, chartStart, now - 30 * DAY)

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
    payload.find({ collection: 'requests', where: { status: { equals: 'new' } }, sort: 'createdAt', limit: 8, depth: 1 }),
    payload.find({ collection: 'requests', where: mineWhere, sort: 'updatedAt', limit: 8, depth: 1 }),
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
  const todayAppts = appts.docs.filter((a) => new Date(a.startsAt).getTime() < dayEnd)
  const weekCount = recent.docs.filter((r) => new Date(r.createdAt).getTime() >= weekStart).length
  const monthCount = recent.docs.filter((r) => new Date(r.createdAt).getTime() >= monthStart).length

  const perDay = Array.from({ length: 14 }, (_, i) => {
    const from = parisTime(p.y, p.m, p.d - 13 + i, 0, 0)
    const to = parisTime(p.y, p.m, p.d - 12 + i, 0, 0)
    return { from, count: recent.docs.filter((r) => { const t = new Date(r.createdAt).getTime(); return t >= from && t < to }).length }
  })
  const chartTotal = perDay.reduce((s, d) => s + d.count, 0)
  const chartMax = Math.max(1, ...perDay.map((d) => d.count))

  const last30 = recent.docs.filter((r) => new Date(r.createdAt).getTime() >= now - 30 * DAY)
  const byType = (Object.keys(TYPE_LABELS) as Request['type'][]).map((t) => ({ t, n: last30.filter((r) => r.type === t).length }))
  const byTypeMax = Math.max(1, ...byType.map((b) => b.n))
  const decided = last30.filter((r) => ['approved', 'delivered', 'refused'].includes(r.status))
  const approvalRate = decided.length ? Math.round((decided.filter((r) => r.status !== 'refused').length / decided.length) * 100) : null
  const firstReplies = last30.flatMap((r) => {
    const first = r.history?.find((h) => h.status && h.status !== 'new' && h.at)
    return first?.at ? [(new Date(first.at).getTime() - new Date(r.createdAt).getTime()) / HOUR] : []
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

  const greeting = p.hour >= 5 && p.hour < 12 ? 'Bonjour' : p.hour >= 12 && p.hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  const summary = [
    fresh ? plural(fresh, 'demande à prendre', 'demandes à prendre') : 'Aucune demande en attente',
    plural(todayAppts.length, 'rendez-vous aujourd’hui', 'rendez-vous aujourd’hui'),
  ].join(' · ')

  return (
    <div className="la-board">
      <header className="la-head">
        <div>
          <span className="la-filet" />
          <p className="la-eyebrow">{isAdmin ? 'Poste administrateur' : 'Poste commercial'}</p>
          <h2 className="la-title">{firstName ? `${greeting} ${firstName}` : greeting}</h2>
          <p className="la-sub">{summary}</p>
        </div>
        <div className="la-head-side">
          <span className="la-date">{fmtDay(now)}</span>
          <a className="la-link-btn" href="/admin/collections/requests">Toutes les demandes</a>
          {isAdmin && <a className="la-link-btn la-link-btn--red" href="/admin/collections/vehicles/create">Ajouter un véhicule</a>}
        </div>
      </header>

      {(stale.totalDocs > 0 || overdue.totalDocs > 0 || missing.totalDocs > 0) && (
        <div className="la-alerts">
          {stale.totalDocs > 0 && (
            <a className="la-alert" href="/admin/collections/requests?where[status][equals]=new&sort=createdAt">
              <strong>{plural(stale.totalDocs, 'demande')} sans réponse depuis plus de {staleHours} h</strong>
              <span>Le client attend un premier appel</span>
            </a>
          )}
          {overdue.totalDocs > 0 && (
            <a className="la-alert" href={`/admin/collections/appointments?where[status][equals]=confirmed&where[startsAt][less_than]=${iso(dayStart)}`}>
              <strong>{plural(overdue.totalDocs, 'rendez-vous passé', 'rendez-vous passés')} à clôturer</strong>
              <span>Indiquez s’ils ont été honorés ou annulés</span>
            </a>
          )}
          {missing.totalDocs > 0 && (
            <a className="la-alert la-alert--navy" href="/admin/collections/requests?where[missingDocuments][equals]=true&where[status][in]=new,review">
              <strong>{plural(missing.totalDocs, 'dossier incomplet', 'dossiers incomplets')}</strong>
              <span>Justificatifs encore attendus (relances automatiques à 48 h et 5 j)</span>
            </a>
          )}
        </div>
      )}

      <div className="la-kpis">
        <Kpi label="À prendre" value={fresh} hint={stale.totalDocs ? `dont ${stale.totalDocs} en retard` : 'nouvelles demandes'} href="/admin/collections/requests?where[status][equals]=new&sort=createdAt" hot={stale.totalDocs > 0} />
        <Kpi label={isAdmin ? 'En cours' : 'Mes dossiers'} value={inProgress.totalDocs} hint="en étude ou accordés" href={isAdmin ? '/admin/collections/requests?where[status][in]=review,approved' : `/admin/collections/requests?where[assignedTo][equals]=${user.id}&where[status][in]=review,approved`} />
        <Kpi label="Rendez-vous" value={todayAppts.length} hint={`aujourd’hui · ${appts.docs.length} sur 7 jours`} href="/admin/collections/appointments" />
        <Kpi label="Cette semaine" value={weekCount} hint={`demandes reçues · ${monthCount} ce mois`} href="/admin/collections/requests?sort=-createdAt" />
      </div>

      <div className="la-main">
        <div className="la-col">
          <section className="la-card">
            <div className="la-card-head">
              <h3 className="la-card-title">À prendre</h3>
              <a className="la-more" href="/admin/collections/requests?where[status][equals]=new&sort=createdAt">
                {toTake.totalDocs > toTake.docs.length ? `Voir les ${toTake.totalDocs}` : 'Tout voir'}
              </a>
            </div>
            {toTake.docs.length === 0 ? (
              <p className="la-empty">Toutes les demandes ont été prises en charge.</p>
            ) : (
              <ul className="la-list">
                {toTake.docs.map((r) => (
                  <RequestRow key={r.id} r={r} late={new Date(r.createdAt).getTime() < now - staleHours * HOUR} />
                ))}
              </ul>
            )}
          </section>

          <section className="la-card">
            <div className="la-card-head">
              <h3 className="la-card-title">{isAdmin ? 'Dossiers en cours' : 'Mes dossiers'}</h3>
              <a className="la-more" href={isAdmin ? '/admin/collections/requests?where[status][in]=review,approved' : `/admin/collections/requests?where[assignedTo][equals]=${user.id}`}>
                {inProgress.totalDocs > inProgress.docs.length ? `Voir les ${inProgress.totalDocs}` : 'Tout voir'}
              </a>
            </div>
            {inProgress.docs.length === 0 ? (
              <p className="la-empty">{isAdmin ? 'Aucun dossier en étude ou accordé.' : 'Aucun dossier en cours. Prenez une demande ci-dessus.'}</p>
            ) : (
              <ul className="la-list">
                {inProgress.docs.map((r) => (
                  <RequestRow key={r.id} r={r} owner={isAdmin ? (ownerName(r) ?? 'Non attribué') : null} />
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="la-col">
          <section className="la-card">
            <div className="la-card-head">
              <h3 className="la-card-title">Agenda</h3>
              <a className="la-more" href="/admin/collections/appointments">Tous les rendez-vous</a>
            </div>
            {days.size === 0 ? (
              <p className="la-empty">Aucun rendez-vous dans les 7 prochains jours.</p>
            ) : (
              [...days.entries()].map(([offset, list]) => (
                <div className="la-day" key={offset}>
                  <p className="la-day-label">{dayLabel(offset)}</p>
                  {list.map((a) => {
                    const past = new Date(a.startsAt).getTime() < now
                    const when = offset === -1 ? new Date(a.startsAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Europe/Paris' }) : fmtTime(a.startsAt)
                    const vehicle = a.vehicle && typeof a.vehicle === 'object' ? a.vehicle.title : null
                    return (
                      <div key={a.id} className={`la-appt${past ? ' la-appt-past' : ''}`}>
                        <span className="la-appt-time">{when}</span>
                        <div style={{ minWidth: 0 }}>
                          <a href={`/admin/collections/appointments/${a.id}`}>
                            <strong>{a.name}</strong> <span className="la-tag">{KIND_LABELS[a.kind]}</span>
                            {past && offset !== -1 && <> <span className="la-tag la-tag--warn">À clôturer</span></>}
                          </a>
                          {vehicle && <span className="la-row-meta">{vehicle}</span>}
                          <div className="la-appt-actions">
                            <a className="la-phone" href={tel(a.phone)}>{a.phone}</a>
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
          </section>

          <section className="la-card">
            <div className="la-card-head">
              <h3 className="la-card-title">Stock</h3>
              <a className="la-more" href="/admin/collections/vehicles">Voir le stock</a>
            </div>
            <div className="la-stats">
              <Stat value={available.totalDocs} label="Disponibles en ligne" href="/admin/collections/vehicles?where[status][equals]=available" />
              <Stat value={reserved.totalDocs} label="Réservés" href="/admin/collections/vehicles?where[status][equals]=reserved" />
              <Stat value={soldMonth.totalDocs} label="Vendus ce mois" href="/admin/collections/vehicles?where[status][equals]=sold&sort=-soldAt" />
              <Stat value={drafts.totalDocs} label="Brouillons (hors site)" href="/admin/collections/vehicles?where[_status][equals]=draft" />
            </div>
          </section>
        </div>
      </div>

      <div className="la-grid2">
        <section className="la-card">
          <div className="la-card-head">
            <h3 className="la-card-title">Demandes reçues, 14 derniers jours</h3>
            <span className="la-card-note">{plural(chartTotal, 'demande')}</span>
          </div>
          <div className="la-chart" role="img" aria-label={`Demandes reçues par jour : ${perDay.map((d) => `${fmtDay(d.from + 12 * HOUR)} ${d.count}`).join(', ')}`}>
            {perDay.map((d) => (
              <div key={d.from} className={`la-bar${d.count ? '' : ' la-bar--zero'}`} title={`${fmtDay(d.from + 12 * HOUR)} : ${plural(d.count, 'demande')}`}>
                <span style={{ height: `${(d.count / chartMax) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="la-axis" aria-hidden>
            {perDay.map((d, i) => (
              <span key={d.from}>{i === 13 ? <b>auj.</b> : i % 3 === 1 ? new Date(d.from + 12 * HOUR).toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric', timeZone: 'Europe/Paris' }) : ''}</span>
            ))}
          </div>
        </section>

        <section className="la-card">
          <div className="la-card-head">
            <h3 className="la-card-title">Toutes les demandes par statut</h3>
            <span className="la-card-note">{plural(statusTotal, 'demande')}</span>
          </div>
          <div className="la-seg" role="img" aria-label={STATUS.map((s, i) => `${s.label} ${statusCounts[i].totalDocs}`).join(', ')}>
            {STATUS.map((s, i) => statusCounts[i].totalDocs > 0 && <span key={s.key} title={`${s.label} : ${statusCounts[i].totalDocs}`} style={{ flex: statusCounts[i].totalDocs, background: s.color }} />)}
          </div>
          <div className="la-legend">
            {STATUS.map((s, i) => (
              <a key={s.key} href={`/admin/collections/requests?where[status][equals]=${s.key}`}>
                <span className="la-dot" style={{ background: s.color }} />
                {s.label} <b>{statusCounts[i].totalDocs}</b>
              </a>
            ))}
          </div>
          <div className="la-hbars" style={{ marginTop: 18 }}>
            <p className="la-card-note">Par type, 30 derniers jours</p>
            {byType.map(({ t, n }) => (
              <div key={t} className="la-hbar-row">
                <span>{TYPE_LABELS[t]}</span>
                <div className="la-hbar-track"><span style={{ width: `${(n / byTypeMax) * 100}%` }} /></div>
                <b>{n}</b>
              </div>
            ))}
          </div>
        </section>
      </div>

      {isAdmin && (
        <>
          <div className="la-kpis">
            <Kpi label="Taux d’accord" value={approvalRate == null ? '–' : `${approvalRate} %`} hint={`sur ${plural(decided.length, 'dossier tranché', 'dossiers tranchés')}, 30 j`} href="/admin/collections/requests?where[status][in]=approved,delivered,refused" />
            <Kpi label="1re réponse" value={avgReply == null ? '–' : duration(avgReply)} hint="délai moyen de prise en charge, 30 j" href="/admin/collections/requests?sort=-createdAt" />
            <Kpi label="Abonnés" value={subscribers.totalDocs} hint="alertes et newsletter" href="/admin/collections/subscribers" />
            <Kpi label="Vendus ce mois" value={soldMonth.totalDocs} hint="véhicules passés en vendu" href="/admin/collections/vehicles?where[status][equals]=sold&sort=-soldAt" />
          </div>

          <div className="la-grid2">
            <section className="la-card">
              <div className="la-card-head">
                <h3 className="la-card-title">Équipe</h3>
                <a className="la-more" href="/admin/collections/users">Gérer les accès</a>
              </div>
              {team.docs.map((u) => (
                <div key={u.id} className="la-team-row">
                  <span>
                    <strong>{u.name}</strong>{' '}
                    <span className="la-tag">{u.role === 'admin' ? 'Admin' : 'Commercial'}</span>
                    {u.disabled && <> <span className="la-tag la-tag--warn">Accès coupé</span></>}
                  </span>
                  <a className="la-card-note" href={`/admin/collections/requests?where[assignedTo][equals]=${u.id}&where[status][in]=new,review,approved`}>
                    {plural(load.get(u.id) ?? 0, 'dossier ouvert', 'dossiers ouverts')}
                  </a>
                </div>
              ))}
            </section>

            <section className="la-card">
              <h3 className="la-card-title" style={{ marginBottom: 10 }}>Mise en service</h3>
              <Service ok={Boolean(process.env.RESEND_API_KEY)} name="E-mails (Resend)" on={`Envoi depuis ${process.env.EMAIL_FROM || 'contact@lease-auto.fr'}`} off="Les e-mails s’affichent dans la console. Ajoutez RESEND_API_KEY." />
              <Service ok={Boolean(process.env.AUTH0_DOMAIN && process.env.AUTH0_CLIENT_ID)} name="Connexion équipe (Auth0)" on="Connexion sécurisée active" off="Comptes de démo locaux uniquement. Ajoutez les clés AUTH0_*." />
              <Service ok={Boolean(process.env.BLOB_READ_WRITE_TOKEN)} name="Stockage des fichiers (Vercel Blob)" on="Photos et justificatifs stockés en ligne" off="Fichiers sur le disque local. Ajoutez BLOB_READ_WRITE_TOKEN en production." />
              <Service ok={Boolean(process.env.CRON_SECRET)} name="Automatisations" on="Relances et rappels toutes les heures (GitHub Actions)" off="Ajoutez CRON_SECRET pour activer les relances." />
              <div className="la-shortcuts" style={{ marginTop: 14 }}>
                <a className="la-link-btn" href="/admin/collections/campaigns/create">Nouvelle newsletter</a>
                <a className="la-link-btn" href="/admin/globals/settings">Réglages</a>
                <a className="la-link-btn" href="/admin/globals/agenda">Horaires de l’agenda</a>
                <a className="la-link-btn" href="/admin/globals/homepage">Page d’accueil</a>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  )
}

function RequestRow({ r, late = false, owner = null }: { r: Request; late?: boolean; owner?: string | null }) {
  const [label, tone] = STATUS_TAG[r.status]
  return (
    <li className="la-row">
      <a className="la-row-main" href={`/admin/collections/requests/${r.id}`}>
        <span className="la-row-top">
          <strong>{r.firstName} {r.lastName}</strong>
          <span className={`la-tag ${tone}`}>{label}</span>
          {late && <span className="la-tag la-tag--warn">En retard</span>}
          {r.type === 'financing' && r.missingDocuments && r.status !== 'approved' && <span className="la-tag la-tag--line">Pièces manquantes</span>}
        </span>
        <span className="la-row-meta">{contextLine(r)}</span>
        <span className="la-row-age">
          Reçue {age(r.createdAt)}
          {owner ? ` · suivi par ${owner}` : ''}
        </span>
      </a>
      <span className="la-row-actions">
        <a className="la-phone" href={tel(r.phone)}>{r.phone}</a>
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

function Kpi({ label, value, hint, href, hot = false }: { label: string; value: number | string; hint: string; href: string; hot?: boolean }) {
  return (
    <a className={`la-kpi${hot ? ' la-kpi--hot' : ''}`} href={href}>
      <div className="la-kpi-label">{label}</div>
      <div className="la-kpi-value" style={hot ? { color: '#de1d22' } : undefined}>{value}</div>
      <div className="la-kpi-hint">{hint}</div>
    </a>
  )
}

function Stat({ value, label, href }: { value: number; label: string; href: string }) {
  return (
    <a className="la-stat" href={href}>
      <div className="la-stat-value">{value}</div>
      <div className="la-stat-label">{label}</div>
    </a>
  )
}

function Service({ ok, name, on, off }: { ok: boolean; name: string; on: string; off: string }) {
  return (
    <div className="la-service">
      <span className={`la-tag ${ok ? 'la-tag--green' : 'la-tag--warn'}`}>{ok ? 'Actif' : 'À configurer'}</span>
      <div>
        <strong>{name}</strong>
        <small>{ok ? on : off}</small>
      </div>
    </div>
  )
}
