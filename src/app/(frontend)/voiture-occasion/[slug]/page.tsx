import type { Metadata } from 'next'
import Link from 'next/link'
import { cache } from 'react'

import { FormulasSection } from '@/components/home/Sections'
import { CreditNotice } from '@/components/ui/CreditNotice'
import { PageHero } from '@/components/ui/PageHero'
import { Prose } from '@/components/ui/Prose'
import { VehicleCard } from '@/components/vehicles/VehicleCard'
import { seoMeta } from '@/lib/catalog-lookup'
import { getSettings, payloadClient, visibleVehiclesWhere } from '@/lib/payload'
import { redirectOrNotFound } from '@/lib/redirects'

type Props = { params: Promise<{ slug: string }> }

export const revalidate = 3600

const getPage = cache(async (slug: string) => {
  const payload = await payloadClient()
  const { docs } = await payload.find({ collection: 'local-pages', where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] }, limit: 1, depth: 1 })
  return docs[0] ?? null
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getPage((await params).slug)
  if (!p) return {}
  return {
    ...seoMeta(p, {
      title: `Voiture d’occasion en LOA ou crédit à ${p.city}`,
      description: `Lease Auto livre à ${p.city} des voitures d’occasion contrôlées, garanties 12 mois, financées en LOA, LLD ou crédit.`,
    }),
    alternates: { canonical: `/voiture-occasion/${p.slug}` },
  }
}

/** SEO-03 : page locale (Épinay-sur-Seine, Saint-Denis, Paris nord, 93, 95). */
export default async function LocalPage({ params }: Props) {
  const { slug } = await params
  const p = await getPage(slug)
  if (!p) return redirectOrNotFound(`/voiture-occasion/${slug}`)

  const payload = await payloadClient()
  const [where, settings] = await Promise.all([visibleVehiclesWhere(), getSettings()])
  const vehicles = await payload.find({ collection: 'vehicles', where: { and: [...where.and, { status: { equals: 'available' } }] }, sort: '-createdAt', limit: 6, depth: 1 })
  const c = settings.company

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    name: c?.name ?? 'Lease Auto',
    areaServed: p.city,
    telephone: c?.phone,
    address: { '@type': 'PostalAddress', streetAddress: c?.address, postalCode: c?.postalCode, addressLocality: c?.city, addressCountry: 'FR' },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <PageHero eyebrow={`Voiture d’occasion · ${p.city}`} title={p.headline} intro={p.distanceNote ?? undefined} crumbs={[{ label: p.city }]}>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/vehicules" className="btn-primary">Voir le stock</Link>
          <Link href="/rendez-vous" className="btn-ghost">Venir à l’agence</Link>
        </div>
      </PageHero>
      <div className="container-site pb-14">
        <Prose data={p.content} className="[&>div>p:first-child]:mt-0" />
      </div>
      {vehicles.docs.length > 0 && (
        <section className="container-site pb-16">
          <h2 className="mb-6 text-2xl font-black text-primary">Disponibles pour une livraison à {p.city}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.docs.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        </section>
      )}
      <FormulasSection />
      <div className="container-site py-12">
        <CreditNotice className="border-t border-line pt-6" />
      </div>
    </>
  )
}
