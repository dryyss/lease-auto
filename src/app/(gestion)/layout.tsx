import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import type { ReactNode } from 'react'

// Mêmes styles et même police que le site public (charte Lease Auto).
import '../(frontend)/styles.css'

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' })

export const viewport: Viewport = { width: 'device-width', initialScale: 1 }
export const metadata: Metadata = {
  title: { default: 'Gestion | Lease Auto', template: '%s | Gestion Lease Auto' },
  robots: { index: false, follow: false },
}

export default function GestionRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={jakarta.variable}>
      <body>{children}</body>
    </html>
  )
}
