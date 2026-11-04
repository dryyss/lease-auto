import type { Metadata } from 'next'

import { PageHero } from '@/components/ui/PageHero'
import { FavoritesView } from '@/components/vehicles/FavoritesView'

export const metadata: Metadata = { title: 'Mes favoris et comparateur', robots: { index: false } }

export default function FavoritesPage() {
  return (
    <>
      <PageHero eyebrow="Favoris" title="Mes véhicules favoris" intro="Gardés sur cet appareil, sans compte. Comparez jusqu’à 3 véhicules côte à côte." />
      <div className="container-site pb-16">
        <FavoritesView />
      </div>
    </>
  )
}
