'use client'

import { Calculator, CarFront, ChevronDown, FileSignature, KeyRound, Menu, Phone, Wallet, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { FavoritesLink } from '@/components/vehicles/Favorites'

const financing = [
  { name: 'LOA', desc: 'Location avec option d’achat', href: '/financement/loa', icon: KeyRound },
  { name: 'LLD', desc: 'Location longue durée, sans engagement d’achat', href: '/financement/lld', icon: FileSignature },
  { name: 'Crédit auto', desc: 'Vous êtes propriétaire dès le départ', href: '/financement/credit', icon: Wallet },
  { name: 'Simulateur', desc: 'Calculez votre mensualité en direct', href: '/simulateur', icon: Calculator },
]

const links = [
  { label: 'Nos véhicules', href: '/vehicules' },
  { label: 'Reprise', href: '/reprise' },
  { label: 'L’agence', href: '/agence' },
  { label: 'Contact', href: '/contact' },
]

export function Header({ phone, phoneHref }: { phone?: string | null; phoneHref?: string }) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdown, setDropdown] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setDropdown(false)
  }, [pathname])

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  const linkClass = (href: string) =>
    `rounded-lg px-3 py-2 text-[15px] font-medium whitespace-nowrap transition-colors xl:px-3.5 ${
      isActive(href) ? 'text-accent' : 'text-gray-700 hover:text-primary'
    }`

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'border-b border-line/70 bg-white/90 shadow-sm backdrop-blur-xl' : 'bg-white/80 backdrop-blur-md'
      }`}
    >
      <nav className="container-site" aria-label="Navigation principale">
        <div className="flex h-16 items-center justify-between sm:h-[76px]">
          <Link href="/" className="shrink-0" aria-label="Lease Auto, accueil">
            <Image src="/images/logo-lease-auto.png" alt="Lease Auto" width={456} height={85} priority className="h-8 w-auto sm:h-10" />
          </Link>

          <div className="hidden items-center gap-0.5 lg:flex">
            <Link href={links[0].href} className={linkClass(links[0].href)}>
              {links[0].label}
            </Link>

            <div
              className="relative"
              onMouseEnter={() => {
                clearTimeout(timer.current)
                setDropdown(true)
              }}
              onMouseLeave={() => {
                timer.current = setTimeout(() => setDropdown(false), 150)
              }}
            >
              <button
                type="button"
                className={`${linkClass('/financement')} flex items-center gap-1.5`}
                aria-expanded={dropdown}
                aria-haspopup="true"
                onClick={() => setDropdown((v) => !v)}
              >
                Financement
                <ChevronDown className={`size-3.5 transition-transform ${dropdown ? 'rotate-180' : ''}`} aria-hidden />
              </button>
              <div
                className={`absolute top-full left-1/2 -translate-x-1/2 pt-3 transition-all duration-200 ${
                  dropdown ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-2 opacity-0'
                }`}
              >
                <div className="w-85 overflow-hidden rounded-2xl border border-line bg-white p-2 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.18)]">
                  {financing.map(({ name, desc, href, icon: Icon }) => (
                    <Link key={href} href={href} className="group flex items-start gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-soft">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-gray-900">{name}</span>
                        <span className="mt-0.5 block text-xs text-gray-500">{desc}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {links.slice(1).map((l) => (
              <Link key={l.href} href={l.href} className={linkClass(l.href)}>
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {phone && phoneHref && (
              <a href={phoneHref} className="hidden items-center gap-2 text-sm font-bold text-primary hover:text-accent xl:flex">
                <Phone className="size-4 text-accent" aria-hidden />
                {phone}
              </a>
            )}
            <FavoritesLink />
            <Link href="/demande" className="btn-primary hidden px-5! py-2.5! sm:inline-flex">
              <CarFront className="size-4" aria-hidden />
              <span className="lg:hidden xl:inline">Demander un financement</span>
              <span className="hidden lg:inline xl:hidden">Ma demande</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="flex size-10 items-center justify-center rounded-xl text-gray-700 hover:bg-soft lg:hidden"
              aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>

        <div className={`transition-all duration-300 lg:hidden ${mobileOpen ? 'max-h-[calc(100dvh-4.5rem)] overflow-y-auto pb-6 opacity-100' : 'max-h-0 overflow-hidden opacity-0'}`}>
          <div className="space-y-1 border-t border-line pt-4">
            {[links[0], ...financing.map((f) => ({ label: f.name === 'Simulateur' ? 'Simulateur' : `Financement ${f.name}`, href: f.href })), ...links.slice(1)].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-xl px-4 py-3 font-medium ${isActive(item.href) ? 'bg-accent-soft text-accent' : 'text-gray-700 hover:bg-soft'}`}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/demande" className="btn-primary mt-3 w-full">
              Demander un financement
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}
