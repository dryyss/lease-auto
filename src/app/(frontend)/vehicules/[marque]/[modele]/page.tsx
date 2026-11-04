import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Catalog, type CatalogParams } from '@/components/catalog/Catalog'
import { findBrand, findModel, seoMeta } from '@/lib/catalog-lookup'

type Props = { params: Promise<{ marque: string; modele: string }>; searchParams: Promise<CatalogParams> }

export const revalidate = 300

async function load(params: Props['params']) {
  const { marque, modele } = await params
  const brand = await findBrand(marque)
  const model = brand ? await findModel(brand.id, modele) : null
  return { brand, model }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brand, model } = await load(params)
  if (!brand || !model) return {}
  const name = `${brand.name} ${model.name}`
  return {
    ...seoMeta(model, {
      title: `${name} d’occasion en LOA, LLD ou crédit`,
      description: `${name} d’occasion contrôlée et garantie 12 mois, financement LOA, LLD ou crédit avec réponse sous 48 h. Livraison partout en France.`,
    }),
    alternates: { canonical: `/vehicules/${brand.slug}/${model.slug}` },
  }
}

export default async function ModelPage({ params, searchParams }: Props) {
  const { brand, model } = await load(params)
  if (!brand || !model) notFound()
  return <Catalog params={await searchParams} brand={brand} model={model} />
}
