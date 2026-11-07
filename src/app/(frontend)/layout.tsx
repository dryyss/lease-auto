import type { Metadata, Viewport } from 'next'
import { connection } from 'next/server'
import { Plus_Jakarta_Sans } from 'next/font/google'
import Image from 'next/image'
import React from 'react'

import { ContactDock } from '@/components/layout/ContactDock'
import { CookieBanner } from '@/components/layout/CookieBanner'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { telHref, whatsappHref } from '@/lib/format'
import { indexable } from '@/lib/indexing'
import { getSettings } from '@/lib/payload'

import './styles.css'

// Même police que Finarent, chargée par Next (pas de requête Google côté visiteur).
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'),
  title: { default: 'Lease Auto | Voitures d’occasion en LOA, LLD et crédit', template: '%s | Lease Auto' },
  description:
    'Véhicules d’occasion contrôlés et financement LOA, LLD ou crédit. Réponse rapide, garantie 12 mois, livraison partout en France.',
  openGraph: { locale: 'fr_FR', siteName: 'Lease Auto', type: 'website' },
  // SEO-07 : validation Search Console (balise meta), si renseignée
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
  // Hors du vrai domaine (adresse *.vercel.app) : pages exclues de Google, en plus du robots.txt.
  ...(indexable ? {} : { robots: { index: false, follow: false } }),
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Sans clé au build, le pré-rendu appellerait Payload et ferait échouer le déploiement.
  if (!process.env.PAYLOAD_SECRET) await connection()
  const settings = await getSettings()
  const phone = settings.company?.phone

  return (
    <html lang="fr" className={jakarta.variable}>
      <body>
        <div className="site-bg" aria-hidden>
          <Image src="/images/hero.jpg" alt="" fill sizes="100vw" className="object-cover object-[center_40%]" />
          <div className="site-veil" />
        </div>
        <div className="relative z-10">
          <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:font-bold">
            Aller au contenu
          </a>
          <Header phone={phone} phoneHref={telHref(phone)} />
          <main id="contenu">{children}</main>
          <Footer />
          <CookieBanner gaId={process.env.NEXT_PUBLIC_GA_ID} />
          <ContactDock
            phoneHref={telHref(phone)}
            whatsappHref={whatsappHref(settings.company?.whatsapp, 'Bonjour, je souhaite un renseignement sur un véhicule.')}
          />
        </div>
      </body>
    </html>
  )
}
