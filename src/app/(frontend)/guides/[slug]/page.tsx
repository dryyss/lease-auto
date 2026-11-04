import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { cache } from 'react'

import { PageHero } from '@/components/ui/PageHero'
import { Prose } from '@/components/ui/Prose'
import { seoMeta } from '@/lib/catalog-lookup'
import { mediaSrc } from '@/lib/media'
import { payloadClient } from '@/lib/payload'
import { redirectOrNotFound } from '@/lib/redirects'

type Props = { params: Promise<{ slug: string }> }

export const revalidate = 3600

const getArticle = cache(async (slug: string) => {
  const payload = await payloadClient()
  const { docs } = await payload.find({ collection: 'articles', where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] }, limit: 1, depth: 1 })
  return docs[0] ?? null
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await getArticle((await params).slug)
  if (!a) return {}
  return { ...seoMeta(a, { title: a.title, description: a.excerpt ?? '' }), alternates: { canonical: `/guides/${a.slug}` } }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const a = await getArticle(slug)
  if (!a) return redirectOrNotFound(`/guides/${slug}`)
  const cover = mediaSrc(a.cover, 'large')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    datePublished: a.publishedAt ?? a.createdAt,
    dateModified: a.updatedAt,
    publisher: { '@type': 'Organization', name: 'Lease Auto' },
  }

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <PageHero eyebrow="Guide" title={a.title} intro={a.excerpt ?? undefined} crumbs={[{ label: 'Guides', href: '/guides' }, { label: a.title }]} />
      <div className="container-site pb-16">
        {cover && (
          <div className="relative mb-10 aspect-video max-w-4xl overflow-hidden rounded-3xl bg-soft">
            <Image src={cover} alt="" fill priority sizes="(min-width: 1024px) 900px, 100vw" className="object-cover" />
          </div>
        )}
        <Prose data={a.content} />
        <div className="card mt-12 flex max-w-3xl flex-wrap items-center justify-between gap-4 p-6">
          <p className="font-black text-primary">Prêt à passer à l’action ?</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/simulateur" className="btn-ghost">Simuler</Link>
            <Link href="/vehicules" className="btn-primary">Voir les véhicules</Link>
          </div>
        </div>
      </div>
    </article>
  )
}
