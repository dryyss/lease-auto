import { Building2, ChevronRight, ExternalLink, FileText, HelpCircle, Home, MapPin, type LucideIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { PageHeader } from '@/components/gestion/ui'
import { ago, plural } from '@/lib/gestion/labels'
import { requireStaff } from '@/lib/gestion/session'

export const metadata: Metadata = { title: 'Contenus du site' }

type Tile = { href: string; title: string; text: string; summary: string; updatedAt?: string | null; site?: string; icon: LucideIcon }

export default async function ContentsPage() {
  const { payload, user } = await requireStaff()
  const q = { user, overrideAccess: false as const }
  const last = (collection: 'faqs' | 'articles' | 'local-pages') =>
    payload
      .find({ collection, ...(collection === 'faqs' ? {} : { draft: true }), sort: '-updatedAt', limit: 1, depth: 0, select: { updatedAt: true }, ...q })
      .then((r) => r.docs[0]?.updatedAt ?? null)
  const count = (collection: 'faqs' | 'articles' | 'local-pages', published = false) =>
    payload.count({ collection, ...(published ? { where: { _status: { equals: 'published' } } } : {}), ...q }).then((r) => r.totalDocs)

  const [home, agency, faqs, faqLast, articles, articlesLive, articlesLast, locals, localsLive, localsLast] = await Promise.all([
    payload.findGlobal({ slug: 'homepage', depth: 0, ...q }),
    payload.findGlobal({ slug: 'agency', depth: 0, ...q }),
    count('faqs'),
    last('faqs'),
    count('articles'),
    count('articles', true),
    last('articles'),
    count('local-pages'),
    count('local-pages', true),
    last('local-pages'),
  ])

  const tiles: Tile[] = [
    {
      href: '/gestion/contenus/accueil',
      title: 'Page d’accueil',
      text: 'Accroche, chiffres clés, étapes du parcours et questions affichées.',
      summary: `${plural(home.stats?.length ?? 0, 'chiffre clé', 'chiffres clés')}, ${plural(home.steps?.length ?? 0, 'étape')}, ${plural(home.featuredFaqs?.length ?? 0, 'question')}`,
      updatedAt: home.updatedAt,
      site: '/',
      icon: Home,
    },
    {
      href: '/gestion/contenus/agence',
      title: 'Page « L’agence »',
      text: 'Présentation, photos de l’agence et plan d’accès Google Maps.',
      summary: `${plural(agency.photos?.length ?? 0, 'photo')}${agency.mapEmbedUrl ? ', carte affichée' : ', pas de carte'}`,
      updatedAt: agency.updatedAt,
      site: '/agence',
      icon: Building2,
    },
    {
      href: '/gestion/contenus/faq',
      title: 'FAQ',
      text: 'Questions fréquentes, regroupées par thème.',
      summary: plural(faqs, 'question'),
      updatedAt: faqLast,
      site: '/faq',
      icon: HelpCircle,
    },
    {
      href: '/gestion/contenus/articles',
      title: 'Guides et articles',
      text: 'Conseils publiés dans la rubrique « Guides ».',
      summary: `${plural(articles, 'guide')}, dont ${articlesLive} en ligne`,
      updatedAt: articlesLast,
      site: '/guides',
      icon: FileText,
    },
    {
      href: '/gestion/contenus/pages-locales',
      title: 'Pages locales',
      text: 'Une page par ville ou zone desservie, pour le référencement local.',
      summary: `${plural(locals, 'page')}, dont ${localsLive} en ligne`,
      updatedAt: localsLast,
      icon: MapPin,
    },
  ]

  return (
    <>
      <PageHeader title="Contenus du site" subtitle="Les textes, images et pages du site public. Ce que vous enregistrez apparaît aussitôt sur le site." />
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tiles.map((t) => (
          <li key={t.href} className="relative flex flex-col rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <t.icon className="size-5" aria-hidden />
              </span>
              <h2 className="text-base font-black text-primary">
                <Link href={t.href} className="after:absolute after:inset-0 after:rounded-2xl hover:text-accent focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-accent/40">
                  {t.title}
                </Link>
              </h2>
            </div>
            <p className="text-sm text-ink-2">{t.text}</p>
            <p className="mt-3 text-sm font-semibold text-primary">{t.summary}</p>
            <p className="text-xs text-ink-3">{t.updatedAt ? `Dernière modification ${ago(t.updatedAt)}` : 'Jamais modifié'}</p>
            <div className="mt-auto flex items-center justify-between gap-3 pt-4">
              {t.site ? (
                <a href={t.site} target="_blank" rel="noopener noreferrer" className="relative z-10 inline-flex items-center gap-1 text-xs font-bold text-ink-2 hover:text-accent">
                  <ExternalLink className="size-3.5" aria-hidden /> Voir sur le site<span className="sr-only"> : {t.title} (nouvel onglet)</span>
                </a>
              ) : (
                <span className="text-xs text-ink-3">Liens vers le site depuis la liste</span>
              )}
              <ChevronRight className="size-4 text-ink-3" aria-hidden />
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
