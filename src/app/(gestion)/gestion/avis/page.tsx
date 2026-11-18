import { ExternalLink, ShieldAlert, Star } from 'lucide-react'
import type { Metadata } from 'next'
import type { Where } from 'payload'

import { DeleteReview, FeaturedSwitch } from '@/components/gestion/avis/ReviewControls'
import { ReviewForm, type ReviewData } from '@/components/gestion/avis/ReviewForm'
import { dayKey, parisDayKey, todayParis } from '@/components/gestion/rendez-vous/dates'
import { Badge, Card, Empty, FilterPills, PageHeader } from '@/components/gestion/ui'
import { NETWORKS, type Network } from '@/components/ui/SocialLogos'
import { fmtDate } from '@/lib/gestion/labels'
import { requireStaff } from '@/lib/gestion/session'

export const metadata: Metadata = { title: 'Avis clients' }

const NETWORK_KEYS = Object.keys(NETWORKS) as Network[]

/** Sans réseau renseigné, un avis est un avis Google (valeur par défaut de la collection). */
const networkWhere = (n: Network): Where => (n === 'google' ? { or: [{ source: { equals: 'google' } }, { source: { exists: false } }] } : { source: { equals: n } })

export default async function AvisPage({ searchParams }: { searchParams: Promise<{ reseau?: string; une?: string }> }) {
  const sp = await searchParams
  const reseau = NETWORK_KEYS.find((n) => n === sp.reseau)
  const une = sp.une === '1'
  const { payload, user } = await requireStaff()

  const and = (...parts: (Where | false | undefined)[]): Where => ({ and: parts.filter((p): p is Where => !!p) })
  const featuredWhere: Where = { featured: { equals: true } }
  const count = (where: Where) => payload.count({ collection: 'reviews', where, user, overrideAccess: false }).then((r) => r.totalDocs)

  const [reviews, total, featuredCount, allInNetwork, ...perNetwork] = await Promise.all([
    payload.find({ collection: 'reviews', where: and(reseau && networkWhere(reseau), une && featuredWhere), sort: '-date', limit: 300, depth: 0, user, overrideAccess: false }),
    count(and(une && featuredWhere)),
    count(and(reseau && networkWhere(reseau), featuredWhere)),
    count(and(reseau && networkWhere(reseau))),
    ...NETWORK_KEYS.map((n) => count(and(networkWhere(n), une && featuredWhere))),
  ])

  const href = (r: Network | undefined, u: boolean) => {
    const p = new URLSearchParams({ ...(r ? { reseau: r } : {}), ...(u ? { une: '1' } : {}) }).toString()
    return `/gestion/avis${p ? `?${p}` : ''}`
  }
  const today = dayKey(todayParis())

  return (
    <>
      <PageHeader title="Avis clients" subtitle="Avis Google et commentaires Instagram ou TikTok affichés sur le site." actions={<ReviewForm today={today} />} />

      <p className="mb-5 flex items-start gap-2 rounded-2xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm font-semibold text-accent-dark">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          Uniquement de vrais avis : les avis inventés sont interdits. Les avis marqués « Exemple » servent à la démonstration et doivent être supprimés avant la mise en ligne.
        </span>
      </p>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <FilterPills
          items={[
            { href: href(undefined, une), label: 'Tous les réseaux', count: total, active: !reseau },
            ...NETWORK_KEYS.map((n, i) => ({ href: href(n, une), label: NETWORKS[n].name, count: perNetwork[i], active: reseau === n })),
          ]}
        />
        <FilterPills
          items={[
            { href: href(reseau, false), label: 'Tous', count: allInNetwork, active: !une },
            { href: href(reseau, true), label: 'Mis en avant', count: featuredCount, active: une },
          ]}
        />
      </div>

      {reviews.docs.length ? (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reviews.docs.map((r) => {
            const source: Network = r.source ?? 'google'
            const { name, Logo } = NETWORKS[source]
            const example = r.sourceId?.startsWith('exemple-') ?? false
            const data: ReviewData = {
              id: r.id,
              source,
              firstName: r.firstName,
              rating: r.rating ?? null,
              date: parisDayKey(r.date),
              text: r.text,
              url: r.url ?? '',
              featured: !!r.featured,
            }
            return (
              <li key={r.id}>
                <Card className="h-full" padded={false}>
                  <div className="flex flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Logo className="size-8 shrink-0" />
                        <div className="min-w-0">
                          <p className="truncate font-bold text-primary">{r.firstName}</p>
                          <p className="text-xs text-ink-3">
                            {name} · {fmtDate(r.date)}
                          </p>
                        </div>
                      </div>
                      {example && <Badge className="bg-amber-100 text-amber-900">Exemple</Badge>}
                    </div>
                    {source === 'google' && r.rating != null && (
                      <p className="mt-3 flex gap-0.5" aria-label={`Note : ${r.rating} sur 5`}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} className={`size-4 ${n <= (r.rating ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-line'}`} aria-hidden />
                        ))}
                      </p>
                    )}
                    <p className="mt-3 line-clamp-4 flex-1 text-sm text-ink-2">{r.text}</p>
                    {r.url && (
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-accent">
                        Voir sur {name} <ExternalLink className="size-3" aria-hidden />
                      </a>
                    )}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                      <FeaturedSwitch id={r.id} featured={!!r.featured} author={r.firstName} />
                      <div className="flex gap-2">
                        <ReviewForm review={data} today={today} />
                        <DeleteReview id={r.id} author={r.firstName} />
                      </div>
                    </div>
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      ) : (
        <Card>
          <Empty
            icon={Star}
            title={reseau || une ? 'Aucun avis pour ce filtre.' : 'Aucun avis pour le moment.'}
            text="Ajoutez les vrais avis reçus sur Google, Instagram ou TikTok : ils s’afficheront sur l’accueil et la page agence."
          />
        </Card>
      )}
    </>
  )
}
