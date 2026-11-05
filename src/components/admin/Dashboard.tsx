/* eslint-disable @next/next/no-html-link-for-pages -- Routes admin Payload (routeur interne, pas des pages Next) */
import config from '@payload-config'
import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'
import type { CSSProperties } from 'react'

import type { Request } from '@/payload-types'

import { DashAction } from './DashAction'

const TYPE_LABELS: Record<string, string> = { financing: 'Financement', tradein: 'Reprise', contact: 'Contact', callback: 'Rappel' }
const STATUS_LABELS: Record<string, string> = { new: 'Nouvelle', review: 'En étude', approved: 'Accord', refused: 'Refus', delivered: 'Livrée' }
const STATUS_COLOR: Record<string, string> = { new: '#de1d22', review: '#0d2449', approved: '#0f7a4a', refused: '#7c8699', delivered: '#1b3a6b' }
const FORMULA: Record<string, string> = { loa: 'LOA', lld: 'LLD', credit: 'Crédit' }
const KIND_LABELS: Record<string, string> = { 'test-drive': 'Essai', visit: 'Visite', delivery: 'Livraison' }
const NEXT_LABEL: Record<string, string> = { new: 'Prendre en charge', review: 'Accorder', approved: 'Marquer livrée' }

const card: CSSProperties = {
  background: '#fff',
  border: '1px solid #e4e8f0',
  borderRadius: 20,
  padding: 18,
  boxShadow: '0 16px 40px -28px rgba(13, 36, 73, 0.55)',
}

const age = (iso: string) => {
  const hours = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000))
  if (hours < 1) return 'à l’instant'
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.round(hours / 24)
  return days < 30 ? `il y a ${days} j` : `il y a ${Math.round(days / 30)} mois`
}

const greet = (name: string) => {
  const h = new Date().getHours()
  const g = h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir'
  return name ? `${g} ${name.split(' ')[0]}` : g
}

const tel = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`

const contextLine = (r: Request) => {
  const bits = [TYPE_LABELS[r.type] ?? r.type]
  if (r.vehicle && typeof r.vehicle === 'object') bits.push(r.vehicle.title)
  else if (r.tradeIn?.brand) bits.push([r.tradeIn.brand, r.tradeIn.model].filter(Boolean).join(' '))
  if (r.formula) bits.push(FORMULA[r.formula] ?? r.formula)
  if (r.reference) bits.push(r.reference)
  return bits.filter(Boolean).join(' · ')
}

/** ADM-01 : dashboard commercial et administrateur. */
export async function Dashboard() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await nextHeaders() })
  const role = user && 'role' in user ? user.role : null
  const isAdmin = role === 'admin'
  const name = user && 'name' in user && typeof user.name === 'string' ? user.name : ''
  const userId = user && 'id' in user ? user.id : null

  const dayStart = new Date()
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart.getTime() + 86_400_000)
  const weekStart = new Date(dayStart)
  const weekday = weekStart.getDay()
  weekStart.setDate(weekStart.getDate() - (weekday === 0 ? 6 : weekday - 1))
  const monthStart = new Date(dayStart)
  monthStart.setDate(1)
  const staleSince = new Date(Date.now() - 24 * 3_600_000).toISOString()
  const open = { status: { in: ['new', 'review'] } }

  const [
    fresh, review, approved, refused, delivered, stale, missing,
    online, available, reserved, sold,
    subscribers, users,
    today, mine, queue, recent,
    weekRequests, monthRequests, weekAppts,
  ] = await Promise.all([
    payload.count({ collection: 'requests', where: { status: { equals: 'new' } } }),
    payload.count({ collection: 'requests', where: { status: { equals: 'review' } } }),
    payload.count({ collection: 'requests', where: { status: { equals: 'approved' } } }),
    payload.count({ collection: 'requests', where: { status: { equals: 'refused' } } }),
    payload.count({ collection: 'requests', where: { status: { equals: 'delivered' } } }),
    payload.count({ collection: 'requests', where: { and: [{ status: { equals: 'new' } }, { createdAt: { less_than: staleSince } }] } }),
    payload.count({ collection: 'requests', where: { and: [{ type: { equals: 'financing' } }, { missingDocuments: { equals: true } }, open] } }),
    payload.count({ collection: 'vehicles', where: { and: [{ _status: { equals: 'published' } }, { status: { not_equals: 'sold' } }] } }),
    payload.count({ collection: 'vehicles', where: { and: [{ _status: { equals: 'published' } }, { status: { equals: 'available' } }] } }),
    payload.count({ collection: 'vehicles', where: { status: { equals: 'reserved' } } }),
    payload.count({ collection: 'vehicles', where: { and: [{ _status: { equals: 'published' } }, { status: { equals: 'sold' } }] } }),
    isAdmin ? payload.count({ collection: 'subscribers' }) : Promise.resolve({ totalDocs: 0 }),
    isAdmin ? payload.count({ collection: 'users', overrideAccess: true }) : Promise.resolve({ totalDocs: 0 }),
    payload.find({ collection: 'appointments', where: { and: [{ startsAt: { greater_than_equal: dayStart.toISOString() } }, { startsAt: { less_than: dayEnd.toISOString() } }, { status: { equals: 'confirmed' } }] }, sort: 'startsAt', limit: 8, depth: 0 }),
    userId ? payload.find({ collection: 'requests', where: { and: [{ assignedTo: { equals: userId } }, open] }, sort: 'createdAt', limit: 10, depth: 1 }) : Promise.resolve({ docs: [] as Request[] }),
    payload.find({ collection: 'requests', where: open, sort: 'createdAt', limit: 10, depth: 1 }),
    payload.find({ collection: 'requests', sort: '-createdAt', limit: 6, depth: 1 }),
    payload.count({ collection: 'requests', where: { createdAt: { greater_than_equal: weekStart.toISOString() } } }),
    payload.count({ collection: 'requests', where: { createdAt: { greater_than_equal: monthStart.toISOString() } } }),
    payload.count({ collection: 'appointments', where: { and: [{ startsAt: { greater_than_equal: weekStart.toISOString() } }, { status: { equals: 'confirmed' } }] } }),
  ])

  const upcoming = today.docs.length
    ? today
    : await payload.find({
        collection: 'appointments',
        where: { and: [{ startsAt: { greater_than_equal: dayEnd.toISOString() } }, { status: { equals: 'confirmed' } }] },
        sort: 'startsAt',
        limit: 5,
        depth: 0,
      })

  const pipeline = [
    { key: 'new', label: 'Nouvelles', value: fresh.totalDocs },
    { key: 'review', label: 'En étude', value: review.totalDocs },
    { key: 'approved', label: 'Accords', value: approved.totalDocs },
    { key: 'refused', label: 'Refus', value: refused.totalDocs },
    { key: 'delivered', label: 'Livrées', value: delivered.totalDocs },
  ]
  const totalPipeline = pipeline.reduce((s, p) => s + p.value, 0)
  const mineIds = new Set((mine.docs as Request[]).map((r) => r.id))
  const rows = queue.docs as Request[]
  const todayLabel = today.docs.length > 0

  return (
    <div className="la-board">
      <style>{`
        .la-board{display:grid;gap:16px;margin:0 0 28px;padding:22px;border-radius:28px;background:#f4f6fa;color:#0d2449}
        .la-board *{box-sizing:border-box}
        .la-split{display:grid;gap:16px;grid-template-columns:minmax(0,1.5fr) minmax(260px,.8fr)}
        .la-triple{display:grid;gap:16px;grid-template-columns:repeat(3,1fr)}
        .la-metrics{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(140px,1fr))}
        @media(max-width:900px){.la-split,.la-triple{grid-template-columns:1fr}}
        .la-hit{display:block;text-decoration:none;color:inherit;border-radius:14px;padding:12px}
        .la-hit:hover{background:#f4f6fa}
        .la-btn,.la-btn-ghost{border:0;cursor:pointer;font:inherit;font-size:13px;font-weight:700;border-radius:999px;padding:8px 14px;white-space:nowrap}
        .la-btn{background:#de1d22;color:#fff}
        .la-btn:hover{background:#ac1013}
        .la-btn-ghost{background:#fff;color:#0d2449;border:1px solid #e4e8f0}
        .la-btn:disabled,.la-btn-ghost:disabled{opacity:.6;cursor:wait}
        .la-err{font-size:11px;color:#de1d22;font-weight:600}
        .la-filet{display:block;width:72px;height:3px;background:linear-gradient(90deg,#0d2449 0 50%,#de1d22 50% 100%)}
      `}</style>

      <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, alignItems: 'end' }}>
        <div>
          <span className="la-filet" />
          <p style={{ margin: '12px 0 0', fontSize: 12, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#de1d22' }}>
            {isAdmin ? 'Poste administrateur' : 'Poste commercial'}
          </p>
          <h2 style={{ margin: '4px 0 0', fontSize: 30, lineHeight: 1.1, letterSpacing: '-0.03em' }}>{greet(name)}</h2>
          <p style={{ margin: '8px 0 0', color: '#4a5468', fontSize: 15 }}>
            {fresh.totalDocs > 0
              ? `${fresh.totalDocs} demande${fresh.totalDocs > 1 ? 's' : ''} en attente · ${today.docs.length} rendez-vous aujourd’hui`
              : `Aucune demande en attente · ${today.docs.length} rendez-vous aujourd’hui`}
          </p>
        </div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#4a5468' }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' })}
        </p>
      </header>

      {(stale.totalDocs > 0 || missing.totalDocs > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {stale.totalDocs > 0 && (
            <a href="/admin/collections/requests?where[status][equals]=new&sort=createdAt" style={{ ...card, padding: '14px 16px', textDecoration: 'none', color: '#0d2449', borderLeft: '4px solid #de1d22' }}>
              <strong style={{ color: '#de1d22' }}>{stale.totalDocs} demande{stale.totalDocs > 1 ? 's' : ''} sans réponse depuis 24 h</strong>
              <span style={{ display: 'block', marginTop: 4, fontSize: 13, color: '#4a5468' }}>Ouvrir les plus anciennes</span>
            </a>
          )}
          {missing.totalDocs > 0 && (
            <a href="/admin/collections/requests?where[missingDocuments][equals]=true" style={{ ...card, padding: '14px 16px', textDecoration: 'none', color: '#0d2449', borderLeft: '4px solid #0d2449' }}>
              <strong>{missing.totalDocs} dossier{missing.totalDocs > 1 ? 's' : ''} incomplet{missing.totalDocs > 1 ? 's' : ''}</strong>
              <span style={{ display: 'block', marginTop: 4, fontSize: 13, color: '#4a5468' }}>Justificatifs encore manquants</span>
            </a>
          )}
        </div>
      )}

      <section style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <strong style={{ fontSize: 16 }}>Pipeline</strong>
          <span style={{ fontSize: 13, color: '#4a5468' }}>{totalPipeline} demandes</span>
        </div>
        <div style={{ display: 'flex', height: 8, borderRadius: 99, overflow: 'hidden', gap: 3, background: '#f4f6fa', marginBottom: 14 }}>
          {pipeline.map((step) => (
            <div key={step.key} title={`${step.label} : ${step.value}`} style={{ flex: step.value || 0.15, background: STATUS_COLOR[step.key], opacity: step.value ? 1 : 0.25 }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
          {pipeline.map((step) => (
            <a key={step.key} href={`/admin/collections/requests?where[status][equals]=${step.key}`} style={{ textDecoration: 'none', color: '#0d2449', padding: '12px 10px', borderRadius: 16, border: `1px solid ${step.key === 'new' && step.value > 0 ? '#de1d22' : '#e4e8f0'}`, background: step.key === 'new' && step.value > 0 ? '#fff5f5' : '#fff', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: step.value > 0 ? STATUS_COLOR[step.key] : '#c5cedd' }}>{step.value}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4a5468' }}>{step.label}</div>
            </a>
          ))}
        </div>
      </section>

      <div className="la-triple">
        <MetricBlock label="Cette semaine" value={weekRequests.totalDocs} hint="demandes reçues" />
        <MetricBlock label="Ce mois" value={monthRequests.totalDocs} hint="demandes reçues" />
        <MetricBlock label="Rendez-vous" value={weekAppts.totalDocs} hint="confirmés cette semaine" />
      </div>

      <div className="la-split">
        <section style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ fontSize: 16 }}>Demandes à traiter</strong>
            <a href="/admin/collections/requests" style={{ fontSize: 13, color: '#de1d22', textDecoration: 'none', fontWeight: 700 }}>Tout voir</a>
          </div>
          {rows.length === 0 ? (
            <p style={{ margin: '12px 0 0', color: '#4a5468' }}>Aucune demande ouverte.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {rows.map((r) => (
                <li key={r.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12, alignItems: 'center', borderTop: '1px solid #e4e8f0', padding: '12px 0' }}>
                  <a href={`/admin/collections/requests/${r.id}`} className="la-hit" style={{ padding: '4px 8px' }}>
                    <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <strong>{r.firstName} {r.lastName}</strong>
                      {mineIds.has(r.id) && <span style={{ fontSize: 11, fontWeight: 800, color: '#0d2449' }}>À moi</span>}
                      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#fff', background: STATUS_COLOR[r.status] ?? '#7c8699', borderRadius: 999, padding: '2px 8px' }}>{STATUS_LABELS[r.status] ?? r.status}</span>
                    </span>
                    <span style={{ display: 'block', marginTop: 4, fontSize: 13, color: '#4a5468' }}>{contextLine(r)}</span>
                    <span style={{ display: 'block', marginTop: 2, fontSize: 12, color: '#7c8699' }}>{age(r.createdAt)}</span>
                  </a>
                  <span style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
                    <a href={tel(r.phone)} style={{ fontSize: 13, fontWeight: 700, color: '#0d2449', textDecoration: 'none', padding: '8px 4px' }}>{r.phone}</a>
                    {NEXT_LABEL[r.status] && <DashAction id={r.id} kind="advance" label={NEXT_LABEL[r.status]} />}
                    {(r.status === 'new' || r.status === 'review') && <DashAction id={r.id} kind="refuse" label="Refuser" tone="ghost" />}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ fontSize: 16 }}>{todayLabel ? 'Rendez-vous du jour' : 'Prochains rendez-vous'}</strong>
            <a href="/admin/collections/appointments" style={{ fontSize: 13, color: '#de1d22', textDecoration: 'none', fontWeight: 700 }}>Agenda</a>
          </div>
          {upcoming.docs.length === 0 ? (
            <p style={{ margin: '12px 0 0', color: '#4a5468' }}>Rien de planifié.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
              {upcoming.docs.map((a) => (
                <li key={a.id} style={{ borderLeft: '3px solid #de1d22', padding: '8px 0 8px 12px' }}>
                  <a href={`/admin/collections/appointments/${a.id}`} style={{ textDecoration: 'none', color: '#0d2449', fontWeight: 800 }}>
                    {new Date(a.startsAt).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })}
                  </a>
                  <div style={{ fontSize: 13, color: '#4a5468', marginTop: 2 }}>{KIND_LABELS[a.kind] ?? a.kind} · {a.name}</div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
                    <a href={tel(a.phone)} style={{ fontSize: 13, fontWeight: 700, color: '#0d2449', textDecoration: 'none' }}>{a.phone}</a>
                    {a.status === 'confirmed' && <DashAction id={a.id} kind="done" label="Honoré" tone="ghost" />}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section style={card}>
        <strong style={{ display: 'block', marginBottom: 12, fontSize: 16 }}>Stock</strong>
        <div className="la-metrics">
          <Metric label="Disponibles" value={available.totalDocs} href="/admin/collections/vehicles?where[status][equals]=available" />
          <Metric label="Réservés" value={reserved.totalDocs} href="/admin/collections/vehicles?where[status][equals]=reserved" />
          <Metric label="Vendus en ligne" value={sold.totalDocs} href="/admin/collections/vehicles?where[status][equals]=sold" />
          <Metric label="En ligne" value={online.totalDocs} href="/admin/collections/vehicles" />
        </div>
      </section>

      <section style={card}>
        <strong style={{ display: 'block', marginBottom: 4, fontSize: 16 }}>Dernières demandes</strong>
        <div>
          {recent.docs.map((r) => (
            <a key={r.id} href={`/admin/collections/requests/${r.id}`} className="la-hit" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', borderTop: '1px solid #e4e8f0', borderRadius: 0 }}>
              <span>
                <strong style={{ fontSize: 14 }}>{r.firstName} {r.lastName}</strong>
                <span style={{ display: 'block', fontSize: 13, color: '#4a5468' }}>{contextLine(r as Request)}</span>
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, color: STATUS_COLOR[r.status] ?? '#4a5468' }}>{STATUS_LABELS[r.status]}</span>
            </a>
          ))}
        </div>
      </section>

      {isAdmin && (
        <>
          <section style={card}>
            <strong style={{ display: 'block', marginBottom: 12, fontSize: 16 }}>Équipe et abonnés</strong>
            <div className="la-metrics">
              <Metric label="Abonnés" value={subscribers.totalDocs} href="/admin/collections/subscribers" />
              <Metric label="Comptes équipe" value={users.totalDocs} href="/admin/collections/users" />
            </div>
          </section>
          <section style={card}>
            <strong style={{ display: 'block', marginBottom: 12, fontSize: 16 }}>Raccourcis</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Shortcut href="/admin/collections/vehicles/create" label="Nouveau véhicule" accent />
              <Shortcut href="/admin/collections/campaigns/create" label="Nouvelle campagne" />
              <Shortcut href="/admin/globals/settings" label="Réglages" />
              <Shortcut href="/admin/globals/homepage" label="Page d’accueil" />
              <Shortcut href="/admin/globals/agenda" label="Agenda" />
              <Shortcut href="/admin/globals/agency" label="Agence" />
              <Shortcut href="/admin/collections/users" label="Utilisateurs" />
              <Shortcut href="/admin/collections/faqs" label="FAQ" />
              <Shortcut href="/admin/collections/articles" label="Guides" />
              <Shortcut href="/admin/collections/reviews" label="Avis" />
              <Shortcut href="/admin/collections/redirects" label="Redirections" />
            </div>
          </section>
          <section style={{ ...card, background: '#0d2449', color: '#fff', border: 'none' }}>
            <strong style={{ display: 'block', marginBottom: 8 }}>E-mails</strong>
            <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,.82)', lineHeight: 1.55 }}>
              {process.env.RESEND_API_KEY
                ? `Resend est connecté. Les messages partent de ${process.env.EMAIL_FROM || 'contact@lease-auto.fr'}.`
                : 'Resend n’est pas connecté. Les e-mails s’affichent dans la console du serveur. Ajoutez RESEND_API_KEY pour les envoyer.'}
            </p>
          </section>
        </>
      )}
    </div>
  )
}

function MetricBlock({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div style={{ ...card, textAlign: 'center' }}>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#de1d22' }}>{label}</div>
      <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.04em', marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 13, color: '#4a5468' }}>{hint}</div>
    </div>
  )
}

function Metric({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <a href={href} style={{ ...card, padding: '14px 16px', textDecoration: 'none', color: '#0d2449' }}>
      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em' }}>{value}</div>
      <div style={{ fontSize: 13, color: '#4a5468', marginTop: 2 }}>{label}</div>
    </a>
  )
}

function Shortcut({ href, label, accent }: { href: string; label: string; accent?: boolean }) {
  return (
    <a href={href} style={{ padding: '8px 14px', borderRadius: 999, textDecoration: 'none', fontSize: 13, fontWeight: 700, background: accent ? '#de1d22' : '#fff', color: accent ? '#fff' : '#0d2449', border: accent ? '1px solid #de1d22' : '1px solid #e4e8f0' }}>
      {label}
    </a>
  )
}
