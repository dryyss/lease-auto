import { BellRing, Download, Mail } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { SubscriberActions } from '@/components/gestion/abonnes/SubscriberActions'
import {
  criteriaText,
  parseFilter,
  SUBSCRIBER_FILTERS,
  subscriberWhere,
  type SubscriberFilter,
} from '@/components/gestion/abonnes/filters'
import { Pager, SearchBox } from '@/components/gestion/medias/Pager'
import { Badge, btn, Card, Empty, FilterPills, PageHeader } from '@/components/gestion/ui'
import { fmtDate, plural } from '@/lib/gestion/labels'
import { requireStaff } from '@/lib/gestion/session'

export const metadata: Metadata = { title: 'Abonnés' }

const PER_PAGE = 50

export default async function AbonnesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filtre?: string; page?: string }>
}) {
  const sp = await searchParams
  const q = (sp.q ?? '').trim().slice(0, 100)
  const filtre = parseFilter(sp.filtre)
  const page = Math.max(1, Math.floor(Number(sp.page)) || 1)
  const { payload, user } = await requireStaff()

  const count = (f: SubscriberFilter) =>
    payload
      .count({
        collection: 'subscribers',
        where: subscriberWhere(q, f),
        user,
        overrideAccess: false,
      })
      .then((r) => r.totalDocs)
  const [res, ...counts] = await Promise.all([
    payload.find({
      collection: 'subscribers',
      where: subscriberWhere(q, filtre),
      sort: '-createdAt',
      limit: PER_PAGE,
      page,
      depth: 0,
      user,
      overrideAccess: false,
    }),
    ...SUBSCRIBER_FILTERS.map((f) => count(f.key)),
  ])

  // Noms des marques citées dans les alertes affichées.
  const brandIds = [
    ...new Set(
      res.docs.flatMap((s) =>
        (s.criteria?.brands ?? []).filter((b): b is number => typeof b === 'number'),
      ),
    ),
  ]
  const brands = brandIds.length
    ? (
        await payload.find({
          collection: 'brands',
          where: { id: { in: brandIds } },
          limit: brandIds.length,
          depth: 0,
          select: { name: true },
          user,
          overrideAccess: false,
        })
      ).docs
    : []
  const brandName = (id: number) => brands.find((b) => b.id === id)?.name

  const params = (o: { q?: string; filtre?: string; page?: number }) => {
    const p = new URLSearchParams()
    const f = o.filtre ?? filtre
    const s = o.q ?? q
    if (s) p.set('q', s)
    if (f) p.set('filtre', f)
    if (o.page && o.page > 1) p.set('page', String(o.page))
    return p.toString()
  }
  const href = (o: { q?: string; filtre?: string; page?: number }) => {
    const p = params(o)
    return `/gestion/abonnes${p ? `?${p}` : ''}`
  }
  const exportQuery = params({})

  return (
    <>
      <PageHeader
        title="Abonnés"
        subtitle="Inscrits à la newsletter ou aux alertes véhicule depuis le site, avec la date de leur consentement."
        actions={
          // Lien de téléchargement (route serveur), pas une page : balise <a>.
          <a
            href={`/gestion/export/abonnes${exportQuery ? `?${exportQuery}` : ''}`}
            className={btn.ghost}
            download
          >
            <Download className="size-4" aria-hidden /> Exporter (CSV)
          </a>
        }
      />

      <div className="mb-5 space-y-3">
        <SearchBox
          action="/gestion/abonnes"
          id="abonnes-q"
          q={q}
          placeholder="Rechercher un e-mail ou un prénom"
          keep={{ filtre }}
        />
        <FilterPills
          items={SUBSCRIBER_FILTERS.map((f, i) => ({
            href: href({ filtre: f.key, page: 1 }),
            label: f.label,
            count: counts[i],
            active: f.key === filtre,
          }))}
        />
        {q && (
          <Link
            href={href({ q: '', page: 1 })}
            className="inline-block text-sm font-semibold text-accent hover:underline"
          >
            Effacer la recherche
          </Link>
        )}
      </div>

      {res.docs.length ? (
        <Card padded={false}>
          <ul className="divide-y divide-line">
            {res.docs.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-start gap-x-4 gap-y-2 px-4 py-3.5 sm:px-5"
              >
                <span className="min-w-0 flex-1 basis-64">
                  <a
                    href={`mailto:${s.email}`}
                    className="block truncate font-bold text-primary hover:text-accent"
                  >
                    {s.email}
                  </a>
                  <span className="block text-xs text-ink-3">
                    {s.firstName ? `${s.firstName} · ` : ''}consentement donné le{' '}
                    {fmtDate(s.consentAt)}
                  </span>
                </span>
                <span className="flex min-w-0 flex-1 basis-72 flex-col gap-1.5">
                  <span className="flex flex-wrap gap-1.5">
                    {s.newsletter ? (
                      <Badge className="bg-primary text-white">
                        <Mail className="mr-1 size-3" aria-hidden /> Newsletter
                      </Badge>
                    ) : null}
                    {s.alertEnabled ? (
                      <Badge className="bg-emerald-600 text-white">
                        <BellRing className="mr-1 size-3" aria-hidden /> Alerte véhicule
                      </Badge>
                    ) : null}
                    {!s.newsletter && !s.alertEnabled && (
                      <Badge className="bg-line text-ink-2">Désinscrit</Badge>
                    )}
                  </span>
                  {s.alertEnabled && (
                    <span className="text-xs text-ink-2">
                      {criteriaText(s.criteria, brandName)}
                    </span>
                  )}
                </span>
                <SubscriberActions
                  id={s.id}
                  email={s.email}
                  active={!!(s.newsletter || s.alertEnabled)}
                />
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card>
          <Empty
            icon={Mail}
            title={q || filtre ? 'Aucun abonné avec ces filtres.' : 'Aucun abonné pour le moment.'}
            text="Les visiteurs s’inscrivent depuis le site (newsletter ou alerte sur un véhicule recherché)."
          />
        </Card>
      )}

      <Pager
        page={page}
        pages={res.totalPages}
        href={(p) => href({ page: p })}
        total={plural(res.totalDocs, 'abonné')}
      />
    </>
  )
}
