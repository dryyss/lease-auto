import { CalendarDays, ChevronLeft, ChevronRight, Phone, Search, UserRound } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { clientHref, matches } from '@/components/gestion/clients/search'
import { Badge, btn, Card, Empty, field, PageHeader } from '@/components/gestion/ui'
import { fmtDate, fmtDateTime, plural, REQUEST_STATUS_TONE, REQUEST_TYPES, requestStatusLabel, telHref } from '@/lib/gestion/labels'
import { requireStaff } from '@/lib/gestion/session'
import type { Request } from '@/payload-types'

export const metadata: Metadata = { title: 'Clients' }

const MAX_REQUESTS = 2000
const PER_PAGE = 25

type Client = {
  email: string
  name: string
  phone: string
  count: number
  last: Pick<Request, 'id' | 'type' | 'status' | 'createdAt'>
  lastActivity: string
  references: string[]
  nextAppointment?: string
}

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams
  const q = (sp.q ?? '').trim().slice(0, 100)
  const { payload, user } = await requireStaff()

  // Un client = ses demandes regroupées par e-mail. On agrège en mémoire les demandes les plus récentes.
  const [requests, appointments] = await Promise.all([
    payload.find({
      collection: 'requests',
      sort: '-createdAt',
      limit: MAX_REQUESTS,
      depth: 0,
      select: { firstName: true, lastName: true, email: true, phone: true, type: true, status: true, reference: true, createdAt: true, updatedAt: true },
      user,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'appointments',
      where: { and: [{ status: { equals: 'confirmed' } }, { startsAt: { greater_than_equal: new Date().toISOString() } }] },
      sort: 'startsAt',
      limit: 500,
      depth: 0,
      select: { email: true, startsAt: true },
      user,
      overrideAccess: false,
    }),
  ])

  const next = new Map<string, string>()
  for (const a of appointments.docs) {
    const key = a.email.trim().toLowerCase()
    if (!next.has(key)) next.set(key, a.startsAt)
  }

  const byEmail = new Map<string, Client>()
  for (const r of requests.docs) {
    const email = (r.email ?? '').trim().toLowerCase()
    if (!email) continue
    const c = byEmail.get(email)
    if (!c) {
      // Demandes triées de la plus récente à la plus ancienne : la première donne nom, téléphone et dernière demande.
      byEmail.set(email, {
        email,
        name: `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim() || email,
        phone: r.phone ?? '',
        count: 1,
        last: { id: r.id, type: r.type, status: r.status, createdAt: r.createdAt },
        lastActivity: r.updatedAt,
        references: r.reference ? [r.reference] : [],
        nextAppointment: next.get(email),
      })
      continue
    }
    c.count++
    if (r.updatedAt > c.lastActivity) c.lastActivity = r.updatedAt
    if (r.reference) c.references.push(r.reference)
  }

  const all = [...byEmail.values()]
    .filter((c) => matches(q, [c.name, c.email, ...c.references], [c.phone]))
    .sort((a, b) => (a.lastActivity < b.lastActivity ? 1 : -1))
  const pages = Math.max(1, Math.ceil(all.length / PER_PAGE))
  const page = Math.min(pages, Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1))
  const shown = all.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const pageHref = (p: number) => `/gestion/clients?${new URLSearchParams({ ...(q ? { q } : {}), ...(p > 1 ? { page: String(p) } : {}) })}`

  return (
    <>
      <PageHeader title="Clients" subtitle="Toutes les personnes qui ont fait une demande, regroupées par adresse e-mail." />

      <form action="/gestion/clients" className="mb-5 flex max-w-xl gap-2" role="search">
        <label htmlFor="clients-q" className="sr-only">
          Rechercher un client
        </label>
        <input id="clients-q" name="q" type="search" defaultValue={q} placeholder="Nom, e-mail, téléphone ou référence" className={field} />
        <button type="submit" className={btn.dark}>
          <Search className="size-4" aria-hidden /> Rechercher
        </button>
      </form>

      <Card padded={false}>
        {shown.length ? (
          <ul className="divide-y divide-line">
            {shown.map((c) => (
              <li key={c.email} className="relative grid gap-2 px-5 py-4 transition hover:bg-soft/60 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto] md:items-center md:gap-4">
                <div className="min-w-0">
                  <Link href={clientHref(c.email)} className="font-bold text-primary after:absolute after:inset-0 hover:text-accent">
                    {c.name}
                  </Link>
                  <p className="truncate text-sm text-ink-2">{c.email}</p>
                </div>
                <div className="text-sm text-ink-2">
                  {c.phone && (
                    <a href={telHref(c.phone)} className="relative z-10 inline-flex items-center gap-1.5 font-semibold text-primary hover:text-accent">
                      <Phone className="size-3.5" aria-hidden /> {c.phone}
                    </a>
                  )}
                  <p className="text-xs text-ink-3">{plural(c.count, 'demande')}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold text-primary">{REQUEST_TYPES[c.last.type]}</span>
                  <Badge className={REQUEST_STATUS_TONE[c.last.status]}>{requestStatusLabel(c.last)}</Badge>
                  <span className="text-xs text-ink-3">{fmtDate(c.last.createdAt)}</span>
                </div>
                <div className="text-sm">
                  {c.nextAppointment ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-800">
                      <CalendarDays className="size-3.5" aria-hidden /> {fmtDateTime(c.nextAppointment)}
                    </span>
                  ) : (
                    <span className="text-xs text-ink-3">Pas de rendez-vous</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Empty
            icon={UserRound}
            title={q ? `Aucun client ne correspond à « ${q} ».` : 'Aucun client pour le moment.'}
            text={q ? 'Vérifiez l’orthographe ou cherchez par numéro de téléphone.' : 'Chaque demande reçue sur le site crée ici une fiche client.'}
            action={
              q ? (
                <Link href="/gestion/clients" className={btn.ghost}>
                  Voir tous les clients
                </Link>
              ) : undefined
            }
          />
        )}
      </Card>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-2">
        <p>
          {plural(all.length, 'client')}
          {pages > 1 && ` · page ${page} sur ${pages}`}
        </p>
        {pages > 1 && (
          <nav className="flex gap-2" aria-label="Pages">
            {page > 1 ? (
              <Link href={pageHref(page - 1)} className={`${btn.ghost} ${btn.small}`}>
                <ChevronLeft className="size-3.5" aria-hidden /> Précédente
              </Link>
            ) : null}
            {page < pages ? (
              <Link href={pageHref(page + 1)} className={`${btn.ghost} ${btn.small}`}>
                Suivante <ChevronRight className="size-3.5" aria-hidden />
              </Link>
            ) : null}
          </nav>
        )}
      </div>
      {requests.totalDocs > MAX_REQUESTS && (
        <p className="mt-2 text-xs text-ink-3">Seules les {MAX_REQUESTS} demandes les plus récentes sont prises en compte ici. Utilisez la recherche générale pour un dossier plus ancien.</p>
      )}
    </>
  )
}
