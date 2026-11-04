import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { PageHero } from '@/components/ui/PageHero'
import { mediaSrc } from '@/lib/media'
import { payloadClient } from '@/lib/payload'

export const metadata: Metadata = {
  title: 'Guides et conseils pour financer votre voiture',
  description: 'LOA ou crédit, pièces à fournir, reprise, fin de contrat : nos guides pour bien choisir et financer votre voiture d’occasion.',
  alternates: { canonical: '/guides' },
}

export const revalidate = 3600

export default async function GuidesPage() {
  const payload = await payloadClient()
  const { docs } = await payload.find({ collection: 'articles', where: { _status: { equals: 'published' } }, sort: '-publishedAt', limit: 60, depth: 1 })

  return (
    <>
      <PageHero eyebrow="Guides" title="Guides et conseils" intro="Nos conseils pour choisir, financer et entretenir votre voiture d’occasion." crumbs={[{ label: 'Guides' }]} />
      <div className="container-site pb-16">
        {docs.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {docs.map((a) => {
              const src = mediaSrc(a.cover, 'card')
              return (
                <Link key={a.id} href={`/guides/${a.slug}`} className="group card hover-lift flex flex-col overflow-hidden">
                  <div className="relative aspect-3/2 bg-soft">{src && <Image src={src} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />}</div>
                  <div className="flex flex-1 flex-col p-6">
                    {a.publishedAt && <p className="mb-2 text-xs font-semibold text-ink-3">{new Date(a.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
                    <h2 className="mb-2 text-lg font-black text-primary group-hover:text-accent">{a.title}</h2>
                    {a.excerpt && <p className="line-clamp-3 text-sm text-ink-2">{a.excerpt}</p>}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <p className="card p-6 text-ink-2">Les premiers guides arrivent bientôt.</p>
        )}
      </div>
    </>
  )
}
