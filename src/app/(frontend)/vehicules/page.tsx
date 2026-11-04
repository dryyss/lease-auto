import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { Catalog, type CatalogParams } from '@/components/catalog/Catalog'

export const metadata: Metadata = {
  title: 'Voitures d’occasion en LOA, LLD et crédit',
  description: 'Tout le stock Lease Auto : véhicules d’occasion contrôlés, garantis 12 mois, avec mensualité affichée. Livraison partout en France.',
  alternates: { canonical: '/vehicules' },
}

export default async function VehiclesPage({ searchParams }: { searchParams: Promise<CatalogParams> }) {
  const params = await searchParams
  // Le formulaire de filtres envoie marque/modèle en paramètres : on redirige vers la page dédiée (SEO-02).
  const { marque, modele, ...rest } = params
  if (typeof marque === 'string' && marque) {
    const qs = new URLSearchParams(Object.entries(rest).filter((e): e is [string, string] => typeof e[1] === 'string' && e[1] !== '')).toString()
    redirect(`/vehicules/${marque}${typeof modele === 'string' && modele ? `/${modele}` : ''}${qs ? `?${qs}` : ''}`)
  }
  return <Catalog params={rest} />
}
