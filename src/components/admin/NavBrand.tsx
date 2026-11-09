'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

/** Haut de la barre latérale : logo et lien vers le tableau de bord (Payload n'en affiche pas). */
export function NavBrand() {
  const pathname = usePathname()
  const onDashboard = pathname === '/admin' || pathname === '/admin/'

  return (
    <div className="la-nav-brand">
      <Link className="la-nav-logo" href="/admin" aria-label="Lease Auto, tableau de bord">
        <Image src="/images/logo-lease-auto.png" alt="Lease Auto" width={456} height={85} priority />
      </Link>
      <Link className="nav__link" id="nav-dashboard" href="/admin" prefetch={false}>
        {onDashboard && <div className="nav__link-indicator" />}
        <span className="nav__link-label">Tableau de bord</span>
      </Link>
    </div>
  )
}

/** Bas de la barre latérale : accès au site public. */
export function NavSite() {
  return (
    <div className="la-nav-site">
      <a className="nav__link" id="nav-site" href="/" target="_blank" rel="noopener">
        <span className="nav__link-label">Voir le site</span>
      </a>
    </div>
  )
}
