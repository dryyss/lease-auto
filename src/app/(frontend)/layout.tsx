import type { Metadata } from 'next'
import React from 'react'

import './styles.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'),
  title: { default: 'Lease Auto | Voitures d’occasion en LOA, LLD et crédit', template: '%s | Lease Auto' },
  description:
    'Véhicules d’occasion contrôlés et financement LOA, LLD ou crédit. Réponse rapide, garantie 12 mois, livraison partout en France.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
