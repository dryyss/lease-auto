import 'server-only'

import { ExternalLink, FileText, MapPin, Plus } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Badge, btn, Card, Empty, FilterPills, PageHeader } from '@/components/gestion/ui'
import { ago, fmtDate, plural } from '@/lib/gestion/labels'
import { richTextToMarkdown } from '@/lib/gestion/richtext'
import { requireStaff } from '@/lib/gestion/session'

import { DocEditor, type DocState } from './DocEditor'
import { dayInput, seoInitial, toMediaItem } from './load'
import { CONSOLE_BASE, PUBLIC_BASE, type DocKind } from './types'

// Liste et fiche communes aux guides (articles) et aux pages locales.

const TEXT: Record<DocKind, { title: string; subtitle: string; add: string; empty: string; emptyText: string }> = {
  articles: {
    title: 'Guides et articles',
    subtitle: 'Conseils publiés dans la rubrique « Guides » du site.',
    add: 'Écrire un guide',
    empty: 'Aucun guide pour le moment.',
    emptyText: 'Les guides répondent aux questions des clients et aident le site à remonter dans Google.',
  },
  'local-pages': {
    title: 'Pages locales',
    subtitle: 'Une page par ville ou zone desservie, pour être trouvé dans Google près de chez le client.',
    add: 'Créer une page locale',
    empty: 'Aucune page locale pour le moment.',
    emptyText: 'Créez une page par ville proche de l’agence : Saint-Denis, Paris nord, Val-d’Oise…',
  },
}

type Row = { id: number; title?: string | null; city?: string | null; headline?: string | null; slug?: string | null; publishedAt?: string | null; updatedAt: string }

export async function DocListPage({ kind, filter }: { kind: DocKind; filter?: string }) {
  const { payload, user } = await requireStaff()
  const t = TEXT[kind]
  const isArticle = kind === 'articles'
  const q = { user, overrideAccess: false as const, depth: 0, pagination: false as const }

  // Dernières versions (brouillons compris) pour l'affichage ; lignes principales pour savoir ce qui est en ligne.
  const [latest, main] = await Promise.all([
    payload.find({ collection: kind, draft: true, sort: '-updatedAt', ...q }),
    payload.find({ collection: kind, draft: false, select: { _status: true, slug: true }, ...q }),
  ])
  const live = new Map(main.docs.filter((d) => d._status === 'published').map((d) => [d.id, d.slug ?? null]))
  const all = latest.docs as unknown as Row[]
  const shown = filter === 'en-ligne' ? all.filter((d) => live.has(d.id)) : filter === 'brouillons' ? all.filter((d) => !live.has(d.id)) : all
  const base = CONSOLE_BASE[kind]
  const Icon = isArticle ? FileText : MapPin

  return (
    <>
      <PageHeader
        back={{ href: '/gestion/contenus', label: 'Contenus' }}
        title={t.title}
        subtitle={`${t.subtitle} ${plural(all.length, isArticle ? 'guide' : 'page')}, dont ${live.size} en ligne.`}
        actions={
          <Link href={`${base}/nouveau`} className={btn.primary}>
            <Plus className="size-4" aria-hidden /> {t.add}
          </Link>
        }
      />
      <div className="mb-4">
        <FilterPills
          items={[
            { href: base, label: 'Tous', count: all.length, active: !filter },
            { href: `${base}?filtre=en-ligne`, label: 'En ligne', count: live.size, active: filter === 'en-ligne' },
            { href: `${base}?filtre=brouillons`, label: 'Brouillons', count: all.length - live.size, active: filter === 'brouillons' },
          ]}
        />
      </div>

      {shown.length === 0 ? (
        <Card>
          <Empty
            icon={Icon}
            title={all.length ? 'Rien dans ce filtre.' : t.empty}
            text={all.length ? undefined : t.emptyText}
            action={
              <Link href={`${base}/nouveau`} className={btn.primary}>
                <Plus className="size-4" aria-hidden /> {t.add}
              </Link>
            }
          />
        </Card>
      ) : (
        <Card padded={false}>
          <ul className="divide-y divide-line">
            {shown.map((d) => {
              const slug = live.get(d.id)
              const online = live.has(d.id)
              const name = (isArticle ? d.title : d.city) || 'Sans titre'
              return (
                <li key={d.id} className="relative flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 transition hover:bg-soft">
                  <div className="min-w-0 flex-1 basis-64">
                    <Link
                      href={`${base}/${d.id}`}
                      className="font-bold text-primary after:absolute after:inset-0 hover:text-accent focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-accent/40"
                    >
                      {name}
                    </Link>
                    <p className="truncate text-xs text-ink-3">
                      {isArticle ? `${PUBLIC_BASE[kind]}${d.slug ?? ''}` : [d.headline, `${PUBLIC_BASE[kind]}${d.slug ?? ''}`].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  {online ? <Badge className="bg-primary text-white">En ligne</Badge> : <Badge className="bg-white text-ink-2 ring-1 ring-line">Brouillon</Badge>}
                  <span className="w-36 text-xs text-ink-3">
                    {isArticle && d.publishedAt ? `Publié le ${fmtDate(d.publishedAt)}` : `Modifié ${ago(d.updatedAt)}`}
                  </span>
                  {online && slug ? (
                    <a
                      href={`${PUBLIC_BASE[kind]}${slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${btn.ghost} ${btn.small} relative z-10`}
                    >
                      <ExternalLink className="size-3.5" aria-hidden /> Voir sur le site<span className="sr-only"> : {name} (nouvel onglet)</span>
                    </a>
                  ) : (
                    <span className="hidden w-[8.5rem] sm:block" aria-hidden />
                  )}
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </>
  )
}

const EMPTY: DocState = { slug: '', content: '', seo: { title: '', description: '', image: null }, title: '', publishedAt: '', cover: null, excerpt: '', city: '', headline: '', distanceNote: '' }

export function DocNewPage({ kind }: { kind: DocKind }) {
  return <DocEditor kind={kind} initial={EMPTY} published={false} />
}

export async function DocEditPage({ kind, id: rawId, justSaved }: { kind: DocKind; id: string; justSaved: boolean }) {
  const id = Number(rawId)
  if (!Number.isInteger(id) || id <= 0) notFound()
  const { payload, user } = await requireStaff()
  const q = { user, overrideAccess: false as const }
  const [doc, main] = await Promise.all([
    payload.findByID({ collection: kind, id, draft: true, depth: 1, ...q }).catch(() => null),
    payload.findByID({ collection: kind, id, draft: false, depth: 0, select: { _status: true, slug: true }, ...q }).catch(() => null),
  ])
  if (!doc) notFound()
  const published = main?._status === 'published'
  const d = doc as typeof doc & Partial<Row> & { cover?: unknown; excerpt?: string | null; distanceNote?: string | null }

  const initial: DocState = {
    id: doc.id,
    slug: doc.slug ?? '',
    content: await richTextToMarkdown(doc.content),
    seo: seoInitial(doc.meta),
    title: d.title ?? '',
    publishedAt: dayInput(d.publishedAt),
    cover: toMediaItem(d.cover),
    excerpt: d.excerpt ?? '',
    city: d.city ?? '',
    headline: d.headline ?? '',
    distanceNote: d.distanceNote ?? '',
  }
  return <DocEditor key={doc.id} kind={kind} initial={initial} published={published} publicSlug={published ? main?.slug : null} justSaved={justSaved} updatedAt={doc.updatedAt} />
}
