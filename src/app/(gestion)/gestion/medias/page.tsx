import { Images } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { MediaGrid, type MediaCard } from '@/components/gestion/medias/MediaGrid'
import { MediaUpload } from '@/components/gestion/medias/MediaUpload'
import { Pager, SearchBox } from '@/components/gestion/medias/Pager'
import { Card, Empty, PageHeader } from '@/components/gestion/ui'
import { plural } from '@/lib/gestion/labels'
import { requireStaff } from '@/lib/gestion/session'
import { mediaSrc } from '@/lib/media'

export const metadata: Metadata = { title: 'Images' }

const PER_PAGE = 40

export default async function MediasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const sp = await searchParams
  const q = (sp.q ?? '').trim().slice(0, 100)
  const page = Math.max(1, Math.floor(Number(sp.page)) || 1)
  const { payload, user } = await requireStaff()

  const res = await payload.find({
    collection: 'media',
    where: q ? { or: [{ alt: { like: q } }, { filename: { like: q } }] } : undefined,
    sort: '-createdAt',
    limit: PER_PAGE,
    page,
    depth: 0,
    user,
    overrideAccess: false,
  })

  const items: MediaCard[] = res.docs.map((m) => ({
    id: m.id,
    thumb: mediaSrc(m, 'thumb') ?? '',
    large: mediaSrc(m, 'large') ?? mediaSrc(m) ?? '',
    original: mediaSrc(m) ?? '',
    alt: m.alt,
    filename: m.filename ?? '',
    width: m.width ?? null,
    height: m.height ?? null,
    filesize: m.filesize ?? null,
    createdAt: m.createdAt,
  }))

  const href = (p: number) => {
    const s = new URLSearchParams({
      ...(q ? { q } : {}),
      ...(p > 1 ? { page: String(p) } : {}),
    }).toString()
    return `/gestion/medias${s ? `?${s}` : ''}`
  }

  return (
    <>
      <PageHeader
        title="Images"
        subtitle={`${plural(res.totalDocs, 'image')}${q ? ` pour « ${q} »` : ' dans la médiathèque'}. Photos des véhicules, de l’agence et des pages du site.`}
        actions={<MediaUpload />}
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <SearchBox
          action="/gestion/medias"
          id="medias-q"
          q={q}
          placeholder="Rechercher par description ou nom de fichier"
        />
        {q && (
          <Link
            href="/gestion/medias"
            className="text-sm font-semibold text-accent hover:underline"
          >
            Effacer la recherche
          </Link>
        )}
      </div>

      {items.length ? (
        <>
          <MediaGrid items={items} />
          <Pager
            page={page}
            pages={res.totalPages}
            href={href}
            total={plural(res.totalDocs, 'image')}
          />
        </>
      ) : (
        <Card>
          <Empty
            icon={Images}
            title={q ? `Aucune image ne correspond à « ${q} ».` : 'Aucune image pour le moment.'}
            text={
              q
                ? 'Essayez un autre mot.'
                : 'Envoyez vos premières images avec le bouton « Envoyer des images ».'
            }
          />
        </Card>
      )}
    </>
  )
}
