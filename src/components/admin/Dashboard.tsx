import config from '@payload-config'
import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'

/** ADM-01 : vue d'ensemble en haut du tableau de bord de l'administration. */
export async function Dashboard() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await nextHeaders() })
  const role = user && 'role' in user ? user.role : null
  const dayStart = new Date()
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart.getTime() + 86_400_000)
  const staleSince = new Date(Date.now() - 24 * 3_600_000).toISOString()

  const [fresh, online, today, stale, missing] = await Promise.all([
    payload.count({ collection: 'requests', where: { status: { equals: 'new' } } }),
    payload.count({ collection: 'vehicles', where: { and: [{ _status: { equals: 'published' } }, { status: { not_equals: 'sold' } }] } }),
    payload.find({
      collection: 'appointments',
      where: { and: [{ startsAt: { greater_than_equal: dayStart.toISOString() } }, { startsAt: { less_than: dayEnd.toISOString() } }, { status: { equals: 'confirmed' } }] },
      sort: 'startsAt',
      limit: 10,
      depth: 0,
    }),
    payload.count({ collection: 'requests', where: { and: [{ status: { equals: 'new' } }, { createdAt: { less_than: staleSince } }] } }),
    payload.count({ collection: 'requests', where: { and: [{ type: { equals: 'financing' } }, { missingDocuments: { equals: true } }, { status: { in: ['new', 'review'] } }] } }),
  ])

  const tiles = [
    { label: 'Nouvelles demandes', value: fresh.totalDocs, href: '/admin/collections/requests?where[status][equals]=new', alert: false },
    { label: 'Sans réponse depuis 24 h', value: stale.totalDocs, href: '/admin/collections/requests?where[status][equals]=new&sort=createdAt', alert: stale.totalDocs > 0 },
    { label: 'Dossiers incomplets', value: missing.totalDocs, href: '/admin/collections/requests?where[missingDocuments][equals]=true', alert: false },
    { label: 'Véhicules en ligne', value: online.totalDocs, href: '/admin/collections/vehicles', alert: false },
  ]

  return (
    <div style={{ marginBottom: 32 }}>
      <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--theme-elevation-600)' }}>
        {role === 'admin' ? 'Tableau de bord administrateur' : role === 'commercial' ? 'Tableau de bord commercial' : 'Tableau de bord'}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
        {tiles.map((t) => (
          <a
            key={t.label}
            href={t.href}
            style={{
              display: 'block',
              padding: 20,
              borderRadius: 12,
              textDecoration: 'none',
              background: 'var(--theme-elevation-50)',
              border: `1px solid ${t.alert ? '#de1d22' : 'var(--theme-elevation-150)'}`,
            }}
          >
            <div style={{ fontSize: 32, fontWeight: 800, color: t.alert ? '#de1d22' : 'var(--theme-text)' }}>{t.value}</div>
            <div style={{ fontSize: 13, color: 'var(--theme-elevation-600)' }}>{t.label}</div>
          </a>
        ))}
      </div>
      <div style={{ padding: 20, borderRadius: 12, background: 'var(--theme-elevation-50)', border: '1px solid var(--theme-elevation-150)' }}>
        <strong>Rendez-vous du jour</strong>
        {today.docs.length === 0 ? (
          <p style={{ margin: '8px 0 0', color: 'var(--theme-elevation-600)' }}>Aucun rendez-vous aujourd’hui.</p>
        ) : (
          <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
            {today.docs.map((a) => (
              <li key={a.id}>
                <a href={`/admin/collections/appointments/${a.id}`}>
                  {new Date(a.startsAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })} · {a.name} · {a.phone}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
