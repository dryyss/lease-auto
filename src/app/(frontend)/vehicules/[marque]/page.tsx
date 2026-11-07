import type { Metadata } from 'next'

import { Catalog, type CatalogParams } from '@/components/catalog/Catalog'
import { findBrand, seoMeta } from '@/lib/catalog-lookup'
import { redirectOrNotFound } from '@/lib/redirects'

type Props = { params: Promise<{ marque: string }>; searchParams: Promise<CatalogParams> }

export const revalidate = 300

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const brand = await findBrand((await params).marque)
  if (!brand) return {}
  return {
    ...seoMeta(brand, {
      title: `${brand.name} d’occasion en LOA, LLD ou crédit`,
      description: `${brand.name} d’occasion contrôlées et garanties 12 mois chez Lease Auto, avec mensualité affichée. Livraison partout en France.`,
    }),
    alternates: { canonical: `/vehicules/${brand.slug}` },
  }
}

export default async function BrandPage({ params, searchParams }: Props) {
  const { marque } = await params
  const brand = await findBrand(marque)
  // Pas une marque : ancienne fiche véhicule de l'ancien site (/vehicules/<annonce>), vendue depuis -> stock.
  if (!brand) return redirectOrNotFound(`/vehicules/${marque}`, '/vehicules')
  return <Catalog params={await searchParams} brand={brand} />
}
