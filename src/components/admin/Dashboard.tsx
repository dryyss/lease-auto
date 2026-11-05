/* eslint-disable @next/next/no-html-link-for-pages -- Routes admin Payload (routeur interne, pas des pages Next) */
import config from '@payload-config'
import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'
import type { CSSProperties } from 'react'

/* ─── Labels ─── */
const TYPE_LABELS: Record<string, string> = { financing: 'Financement', tradein: 'Reprise', contact: 'Contact', callback: 'Rappel' }
const TYPE_EMOJI: Record<string, string> = { financing: '💰', tradein: '🔄', contact: '💬', callback: '📞' }
const STATUS_LABELS: Record<string, string> = { new: 'Nouvelle', review: 'En étude', approved: 'Accord', refused: 'Refus', delivered: 'Livrée' }
const STATUS_COLOR: Record<string, string> = { new: '#de1d22', review: '#f59e0b', approved: '#10b981', refused: '#6b7280', delivered: '#0d2449' }
const KIND_LABELS: Record<string, string> = { 'test-drive': '🚗 Essai', visit: '🏢 Visite', delivery: '🚚 Livraison' }

/* ─── Styles ─── */
const panel: CSSProperties = { padding: 20, borderRadius: 16, background: 'var(--theme-elevation-50)', border: '1px solid var(--theme-elevation-150)' }
const badge = (bg: string, color = '#fff'): CSSProperties => ({
  display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: bg, color, letterSpacing: '0.04em', textTransform: 'uppercase',
})

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

/** ADM-01 : dashboard complet — commercial et administrateur. */
export async function Dashboard() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await nextHeaders() })
  const role = user && 'role' in user ? user.role : null
  const isAdmin = role === 'admin'
  const name = user && 'name' in user && typeof user.name === 'string' ? user.name : ''
  const userId = user && 'id' in user ? user.id : null

  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart.getTime() + 86_400_000)
  const weekStart = new Date(dayStart); weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
  const monthStart = new Date(dayStart); monthStart.setDate(1)
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
    userId ? payload.find({ collection: 'requests', where: { and: [{ assignedTo: { equals: userId } }, open] }, sort: 'createdAt', limit: 10, depth: 0 }) : Promise.resolve({ docs: [] }),
    payload.find({ collection: 'requests', where: open, sort: 'createdAt', limit: 10, depth: 0 }),
    payload.find({ collection: 'requests', sort: '-createdAt', limit: 6, depth: 0 }),
    payload.count({ collection: 'requests', where: { createdAt: { greater_than_equal: weekStart.toISOString() } } }),
    payload.count({ collection: 'requests', where: { createdAt: { greater_than_equal: monthStart.toISOString() } } }),
    payload.count({ collection: 'appointments', where: { and: [{ startsAt: { greater_than_equal: weekStart.toISOString() } }, { status: { equals: 'confirmed' } }] } }),
  ])

  const upcoming = today.docs.length ? today : await payload.find({
    collection: 'appointments',
    where: { and: [{ startsAt: { greater_than_equal: dayEnd.toISOString() } }, { status: { equals: 'confirmed' } }] },
    sort: 'startsAt', limit: 5, depth: 0,
  })

  const pipeline = [
    { key: 'new', label: 'Nouvelles', value: fresh.totalDocs, icon: '📩' },
    { key: 'review', label: 'En étude', value: review.totalDocs, icon: '🔍' },
    { key: 'approved', label: 'Accords', value: approved.totalDocs, icon: '✅' },
    { key: 'refused', label: 'Refus', value: refused.totalDocs, icon: '❌' },
    { key: 'delivered', label: 'Livrées', value: delivered.totalDocs, icon: '🚗' },
  ]
  const totalPipeline = pipeline.reduce((s, p) => s + p.value, 0)

  const ownQueue = mine.docs.length > 0
  const rows = ownQueue ? mine.docs : queue.docs
  const todayLabel = today.docs.length > 0

  return (
    <div style={{ display: 'grid', gap: 20, marginBottom: 36 }}>
      <style>{`
        .la-dash-split{display:grid;gap:16px;grid-template-columns:minmax(0,1.4fr) minmax(240px,.8fr)}
        .la-triple{display:grid;gap:16px;grid-template-columns:repeat(3,1fr)}
        @media(max-width:860px){.la-dash-split,.la-triple{grid-template-columns:1fr}}
        .la-row-hover:hover{background:var(--theme-elevation-50)!important}
        .la-pipeline-bar{display:flex;height:8px;border-radius:99px;overflow:hidden;gap:2px}
      `}</style>

      {/* ── En-tête ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, alignItems: 'end' }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#de1d22' }}>
            {isAdmin ? '🛡️ Poste administrateur' : '📋 Poste commercial'}
          </p>
          <h2 style={{ margin: '4px 0 0', fontSize: 26, lineHeight: 1.15 }}>{greet(name)}</h2>
          <p style={{ margin: '6px 0 0', color: 'var(--theme-elevation-600)', fontSize: 14 }}>
            {fresh.totalDocs > 0
              ? `${fresh.totalDocs} demande${fresh.totalDocs > 1 ? 's' : ''} en attente · ${today.docs.length} rendez-vous aujourd'hui`
              : `Aucune demande en attente · ${today.docs.length} rendez-vous aujourd'hui`}
          </p>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--theme-elevation-500)' }}>
          📅 {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' })}
        </p>
      </div>

      {/* ── Alertes urgentes ── */}
      {(stale.totalDocs > 0 || missing.totalDocs > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {stale.totalDocs > 0 && (
            <a href="/admin/collections/requests?where[status][equals]=new&sort=createdAt" style={{ ...panel, padding: '12px 16px', textDecoration: 'none', color: '#de1d22', fontWeight: 700, borderColor: '#de1d22', background: '#fef2f2' }}>
              ⚠️ {stale.totalDocs} demande{stale.totalDocs > 1 ? 's' : ''} sans réponse depuis 24 h
            </a>
          )}
          {missing.totalDocs > 0 && (
            <a href="/admin/collections/requests?where[missingDocuments][equals]=true" style={{ ...panel, padding: '12px 16px', textDecoration: 'none', color: '#f59e0b', fontWeight: 700, borderColor: '#f59e0b', background: '#fffbeb' }}>
              📎 {missing.totalDocs} dossier{missing.totalDocs > 1 ? 's' : ''} incomplet{missing.totalDocs > 1 ? 's' : ''}
            </a>
          )}
        </div>
      )}

      {/* ── Pipeline des demandes ── */}
      <section style={panel}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <strong>Pipeline des demandes</strong>
          <span style={{ fontSize: 12, color: 'var(--theme-elevation-500)' }}>{totalPipeline} au total</span>
        </div>
        <div className="la-pipeline-bar" style={{ marginBottom: 14 }}>
          {pipeline.map((step) => (
            <div key={step.key} style={{ flex: step.value || 0.3, background: STATUS_COLOR[step.key], minWidth: step.value ? 4 : 2, opacity: step.value ? 1 : 0.2, borderRadius: 99, transition: 'flex 0.3s' }} title={`${step.label}: ${step.value}`} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
          {pipeline.map((step) => (
            <a key={step.key} href={`/admin/collections/requests?where[status][equals]=${step.key}`} style={{ textDecoration: 'none', color: 'inherit', padding: '10px 12px', borderRadius: 12, border: `1px solid ${step.key === 'new' && step.value > 0 ? '#de1d22' : 'var(--theme-elevation-150)'}`, background: step.key === 'new' && step.value > 0 ? '#fef2f2' : 'transparent', textAlign: 'center' }}>
              <div style={{ fontSize: 11, marginBottom: 4 }}>{step.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: step.value > 0 ? STATUS_COLOR[step.key] : 'var(--theme-elevation-400)' }}>{step.value}</div>
              <div style={{ fontSize: 12, color: 'var(--theme-elevation-600)' }}>{step.label}</div>
            </a>
          ))}
        </div>
      </section>

      {/* ── Métriques rapides ── */}
      <div className="la-triple">
        <div style={{ ...panel, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--theme-elevation-500)', marginBottom: 4 }}>📊 Cette semaine</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{weekRequests.totalDocs}</div>
          <div style={{ fontSize: 12, color: 'var(--theme-elevation-600)' }}>demandes reçues</div>
        </div>
        <div style={{ ...panel, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--theme-elevation-500)', marginBottom: 4 }}>📆 Ce mois</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{monthRequests.totalDocs}</div>
          <div style={{ fontSize: 12, color: 'var(--theme-elevation-600)' }}>demandes reçues</div>
        </div>
        <div style={{ ...panel, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--theme-elevation-500)', marginBottom: 4 }}>🤝 Rendez-vous</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{weekAppts.totalDocs}</div>
          <div style={{ fontSize: 12, color: 'var(--theme-elevation-600)' }}>cette semaine</div>
        </div>
      </div>

      {/* ── File et rendez-vous ── */}
      <div className="la-dash-split">
        <section style={panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <strong>{ownQueue && !isAdmin ? '📂 Mes dossiers' : '📂 Demandes à traiter'}</strong>
            <a href="/admin/collections/requests" style={{ fontSize: 12, color: '#de1d22', textDecoration: 'none', fontWeight: 600 }}>Tout voir →</a>
          </div>
          {rows.length === 0 ? (
            <p style={{ margin: '10px 0 0', color: 'var(--theme-elevation-600)', fontStyle: 'italic' }}>✅ Aucune demande ouverte.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 2 }}>
              {rows.map((r) => (
                <li key={r.id}>
                  <a href={`/admin/collections/requests/${r.id}`} className="la-row-hover" style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 10, alignItems: 'center', textDecoration: 'none', color: 'inherit', padding: '10px 8px', borderRadius: 8, borderBottom: '1px solid var(--theme-elevation-100)' }}>
                    <span style={{ fontSize: 18 }}>{TYPE_EMOJI[r.type] ?? '📋'}</span>
                    <span>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{r.firstName} {r.lastName}</span>
                      <span style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                        <span style={{ fontSize: 11, color: 'var(--theme-elevation-500)' }}>{r.reference}</span>
                        <span style={badge(STATUS_COLOR[r.status] ?? '#6b7280')}>{STATUS_LABELS[r.status] ?? r.status}</span>
                      </span>
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--theme-elevation-500)', whiteSpace: 'nowrap' }}>{age(r.createdAt)}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section style={panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <strong>{todayLabel ? '📍 Rendez-vous du jour' : '📍 Prochains rendez-vous'}</strong>
            <a href="/admin/collections/appointments" style={{ fontSize: 12, color: '#de1d22', textDecoration: 'none', fontWeight: 600 }}>Voir →</a>
          </div>
          {upcoming.docs.length === 0 ? (
            <p style={{ margin: '10px 0 0', color: 'var(--theme-elevation-600)', fontStyle: 'italic' }}>Rien de planifié.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
              {upcoming.docs.map((a) => (
                <li key={a.id}>
                  <a href={`/admin/collections/appointments/${a.id}`} className="la-row-hover" style={{ textDecoration: 'none', color: 'inherit', display: 'block', padding: '10px 8px', borderRadius: 8, borderLeft: '3px solid #0d2449' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: 15 }}>
                        {new Date(a.startsAt).toLocaleString('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })}
                      </span>
                      <span style={{ fontSize: 12 }}>{KIND_LABELS[a.kind] ?? a.kind}</span>
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--theme-elevation-600)' }}>{a.name} · {a.phone}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ── Stock ── */}
      <section style={panel}>
        <strong style={{ display: 'block', marginBottom: 12 }}>🚘 Stock</strong>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
          <Metric label="Disponibles" value={available.totalDocs} color="#10b981" href="/admin/collections/vehicles?where[status][equals]=available" />
          <Metric label="Réservés" value={reserved.totalDocs} color="#f59e0b" href="/admin/collections/vehicles?where[status][equals]=reserved" />
          <Metric label="Vendus (en ligne)" value={sold.totalDocs} color="#6b7280" href="/admin/collections/vehicles?where[status][equals]=sold" />
          <Metric label="En ligne total" value={online.totalDocs} color="#0d2449" href="/admin/collections/vehicles" />
        </div>
      </section>

      {/* ── Activité récente ── */}
      <section style={panel}>
        <strong style={{ display: 'block', marginBottom: 12 }}>🕐 Dernières demandes reçues</strong>
        <div style={{ display: 'grid', gap: 4 }}>
          {recent.docs.map((r) => (
            <a key={r.id} href={`/admin/collections/requests/${r.id}`} className="la-row-hover" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none', color: 'inherit', padding: '8px 8px', borderRadius: 8 }}>
              <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 16 }}>{TYPE_EMOJI[r.type] ?? '📋'}</span>
                <span>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{r.firstName} {r.lastName}</span>
                  <span style={{ fontSize: 12, color: 'var(--theme-elevation-500)', marginLeft: 8 }}>{TYPE_LABELS[r.type]}</span>
                </span>
              </span>
              <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={badge(STATUS_COLOR[r.status] ?? '#6b7280')}>{STATUS_LABELS[r.status]}</span>
                <span style={{ fontSize: 11, color: 'var(--theme-elevation-500)', whiteSpace: 'nowrap' }}>{age(r.createdAt)}</span>
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* ── Admin : abonnés, comptes, raccourcis ── */}
      {isAdmin && (
        <>
          <section style={panel}>
            <strong style={{ display: 'block', marginBottom: 12 }}>👥 Communauté & équipe</strong>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              <Metric label="Abonnés (alertes + newsletter)" value={subscribers.totalDocs} color="#0d2449" href="/admin/collections/subscribers" />
              <Metric label="Comptes équipe" value={users.totalDocs} color="#0d2449" href="/admin/collections/users" />
            </div>
          </section>

          <section style={panel}>
            <strong style={{ display: 'block', marginBottom: 12 }}>⚡ Raccourcis administration</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Shortcut href="/admin/collections/vehicles/create" label="➕ Nouveau véhicule" accent />
              <Shortcut href="/admin/collections/campaigns/create" label="📧 Nouvelle campagne" />
              <Shortcut href="/admin/globals/settings" label="⚙️ Réglages" />
              <Shortcut href="/admin/globals/homepage" label="🏠 Page d'accueil" />
              <Shortcut href="/admin/globals/agenda" label="📅 Agenda" />
              <Shortcut href="/admin/globals/agency" label="🏢 Agence" />
              <Shortcut href="/admin/collections/users" label="👤 Utilisateurs" />
              <Shortcut href="/admin/collections/faqs" label="❓ FAQ" />
              <Shortcut href="/admin/collections/articles" label="📝 Guides" />
              <Shortcut href="/admin/collections/reviews" label="⭐ Avis" />
              <Shortcut href="/admin/collections/redirects" label="🔗 Redirections" />
            </div>
          </section>

          <section style={{ ...panel, background: '#0d2449', color: '#fff', border: 'none' }}>
            <strong style={{ display: 'block', marginBottom: 8 }}>📬 E-mails (Resend)</strong>
            <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
              {process.env.RESEND_API_KEY
                ? `✅ Connecté — les e-mails sont envoyés via Resend depuis ${process.env.EMAIL_FROM || 'contact@lease-auto.fr'}.`
                : '⏳ Non connecté — les e-mails sont affichés dans la console. Ajoutez RESEND_API_KEY dans .env.local pour activer l’envoi.'}
            </p>
            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b' }}>
              Notifications client (accusé, statut, rappels), alertes véhicules, newsletters et relances sont prêtes.
            </p>
          </section>
        </>
      )}
    </div>
  )
}

function Metric({ label, value, color, href }: { label: string; value: number; color: string; href: string }) {
  return (
    <a href={href} style={{ ...panel, padding: '14px 16px', textDecoration: 'none', color: 'inherit', textAlign: 'center', borderLeft: `3px solid ${color}` }}>
      <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--theme-elevation-600)', marginTop: 2 }}>{label}</div>
    </a>
  )
}

function Shortcut({ href, label, accent }: { href: string; label: string; accent?: boolean }) {
  return (
    <a href={href} style={{
      padding: '8px 14px', borderRadius: 999,
      border: accent ? '1px solid #de1d22' : '1px solid var(--theme-elevation-200)',
      textDecoration: 'none',
      color: accent ? '#de1d22' : 'inherit',
      fontSize: 13, fontWeight: 700,
      background: accent ? '#fef2f2' : 'transparent',
    }}>
      {label}
    </a>
  )
}
