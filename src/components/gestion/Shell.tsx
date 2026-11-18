'use client'

import {
  CalendarDays,
  CarFront,
  Clock,
  FileCheck2,
  Images,
  Mail,
  Send,
  Shuffle,
  Tags,
  ChevronLeft,
  ExternalLink,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Star,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'

type Item = { href: string; label: string; icon: typeof FolderOpen; badge?: number; adminOnly?: boolean; external?: boolean }

/** Coquille de la console : menu latéral (repliable sur ordinateur, tiroir sur mobile) et barre du haut. */
export function Shell({
  user,
  counts,
  children,
}: {
  user: { name: string; role: 'admin' | 'commercial'; email: string }
  counts: { requests: number; appointments: number }
  children: ReactNode
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('gestion-menu') === 'replie')
    } catch {}
  }, [])
  const toggle = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem('gestion-menu', c ? 'ouvert' : 'replie')
      } catch {}
      return !c
    })

  const admin = user.role === 'admin'
  const groups: { title: string; items: Item[] }[] = [
    {
      title: 'Activité',
      items: [
        { href: '/gestion', label: 'Tableau de bord', icon: LayoutDashboard },
        { href: '/gestion/demandes', label: 'Demandes', icon: FolderOpen, badge: counts.requests },
        { href: '/gestion/rendez-vous', label: 'Rendez-vous', icon: CalendarDays, badge: counts.appointments },
        { href: '/gestion/clients', label: 'Clients', icon: UserRound },
        { href: '/gestion/justificatifs', label: 'Justificatifs', icon: FileCheck2 },
      ],
    },
    {
      title: 'Stock',
      items: [
        { href: '/gestion/vehicules', label: 'Véhicules', icon: CarFront },
        { href: '/gestion/marques', label: 'Marques et modèles', icon: Tags },
        { href: '/gestion/medias', label: 'Images', icon: Images },
      ],
    },
    {
      title: 'Site',
      items: [
        { href: '/gestion/contenus', label: 'Textes et pages', icon: FileText },
        { href: '/gestion/avis', label: 'Avis clients', icon: Star },
        { href: '/gestion/newsletters', label: 'Newsletters', icon: Send },
        { href: '/gestion/abonnes', label: 'Abonnés', icon: Mail },
      ],
    },
    {
      title: 'Administration',
      items: [
        { href: '/gestion/creneaux', label: 'Créneaux de rendez-vous', icon: Clock },
        { href: '/gestion/reglages', label: 'Réglages', icon: Settings, adminOnly: true },
        { href: '/gestion/redirections', label: 'Redirections', icon: Shuffle, adminOnly: true },
        { href: '/gestion/equipe', label: 'Équipe', icon: Users, adminOnly: true },
      ],
    },
  ]
  const isActive = (href: string) => (href === '/gestion' ? pathname === '/gestion' : pathname === href || pathname.startsWith(`${href}/`))

  return (
    <div className="min-h-dvh bg-soft">
      {open && <div className="fixed inset-0 z-40 bg-primary/40 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} aria-hidden />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-line bg-white transition-all duration-300 ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${collapsed ? 'lg:w-20' : 'lg:w-64'} w-72`}
        aria-label="Menu de la gestion"
      >
        <div className={`flex h-18 shrink-0 items-center border-b border-line ${collapsed ? 'lg:justify-center lg:px-2' : ''} gap-3 px-5`}>
          <Link href="/gestion" className={`shrink-0 ${collapsed ? 'lg:hidden' : ''}`} aria-label="Tableau de bord">
            <Image src="/images/logo-lease-auto.png" alt="Lease Auto" width={124} height={79} className="h-9 w-auto" priority />
          </Link>
          <span className={`ml-auto flex items-center gap-1 ${collapsed ? 'lg:ml-0' : ''}`}>
            <button type="button" onClick={toggle} className="hidden size-8 items-center justify-center rounded-lg text-ink-3 hover:bg-soft hover:text-primary lg:flex" aria-label={collapsed ? 'Déplier le menu' : 'Replier le menu'}>
              <ChevronLeft className={`size-4 transition ${collapsed ? 'rotate-180' : ''}`} aria-hidden />
            </button>
            <button type="button" onClick={() => setOpen(false)} className="flex size-8 items-center justify-center rounded-lg text-ink-3 hover:text-primary lg:hidden" aria-label="Fermer le menu">
              <X className="size-5" aria-hidden />
            </button>
          </span>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto p-3">
          {groups.map((g) => {
            const items = g.items.filter((i) => admin || !i.adminOnly)
            if (!items.length) return null
            return (
              <div key={g.title}>
                <p className={`mb-1.5 px-3 text-[10px] font-black tracking-[0.14em] text-ink-3 uppercase ${collapsed ? 'lg:sr-only' : ''}`}>{g.title}</p>
                <ul className="space-y-1">
                  {items.map((i) => {
                    const active = isActive(i.href)
                    const Icon = i.icon
                    const cls = `flex items-center rounded-xl text-sm font-semibold transition ${collapsed ? 'gap-3 px-3.5 py-2.5 lg:justify-center lg:px-0' : 'gap-3 px-3.5 py-2.5'} ${active ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-ink-2 hover:bg-soft hover:text-primary'}`
                    const content = (
                      <>
                        <Icon className="size-4.5 shrink-0" aria-hidden />
                        <span className={`flex-1 ${collapsed ? 'lg:sr-only' : ''}`}>{i.label}</span>
                        {i.external && !collapsed && <ExternalLink className="size-3.5 opacity-50" aria-hidden />}
                        {!!i.badge && (
                          <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-black ${active ? 'bg-white/20 text-white' : 'bg-accent text-white'} ${collapsed ? 'lg:absolute lg:ml-6 lg:-mt-5' : ''}`}>{i.badge}</span>
                        )}
                      </>
                    )
                    return (
                      <li key={i.href} className="relative">
                        {i.external ? (
                          // Pages de l'ancienne interface (Payload) : vrai lien, autre mise en page.
                          // eslint-disable-next-line @next/next/no-html-link-for-pages
                          <a href={i.href} className={cls} title={collapsed ? i.label : undefined}>
                            {content}
                          </a>
                        ) : (
                          <Link href={i.href} className={cls} title={collapsed ? i.label : undefined} aria-current={active ? 'page' : undefined}>
                            {content}
                          </Link>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </nav>

        <div className={`border-t border-line p-3 ${collapsed ? 'lg:px-2' : ''}`}>
          <div className={`flex items-center gap-3 rounded-xl px-2 py-2 ${collapsed ? 'lg:justify-center' : ''}`}>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-black text-white">
              {user.name
                .split(/\s+/)
                .slice(0, 2)
                .map((w) => w[0]?.toUpperCase())
                .join('') || '?'}
            </span>
            <span className={`min-w-0 flex-1 ${collapsed ? 'lg:hidden' : ''}`}>
              <span className="block truncate text-sm font-bold text-primary">{user.name}</span>
              <span className="block text-xs text-ink-3">{admin ? 'Administrateur' : 'Commercial'}</span>
            </span>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- déconnexion gérée par le middleware */}
            <a href="/admin/logout" className={`flex size-8 items-center justify-center rounded-lg text-ink-3 hover:bg-soft hover:text-accent ${collapsed ? 'lg:hidden' : ''}`} aria-label="Se déconnecter" title="Se déconnecter">
              <LogOut className="size-4" aria-hidden />
            </a>
          </div>
        </div>
      </aside>

      <div className={`transition-all duration-300 ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur sm:px-6">
          <button type="button" onClick={() => setOpen(true)} className="flex size-10 items-center justify-center rounded-xl text-primary hover:bg-soft lg:hidden" aria-label="Ouvrir le menu">
            <Menu className="size-5" aria-hidden />
          </button>
          <form action="/gestion/recherche" className="relative max-w-xl flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
            <label className="sr-only" htmlFor="gestion-q">
              Rechercher
            </label>
            <input
              id="gestion-q"
              name="q"
              type="search"
              placeholder="Rechercher un client, une référence, une plaque…"
              className="w-full rounded-xl border border-line bg-soft py-2.5 pr-3 pl-10 text-sm text-primary outline-none placeholder:text-ink-3 focus:border-accent focus:bg-white focus:ring-3 focus:ring-accent/15"
            />
          </form>
          <a href="/" target="_blank" rel="noopener noreferrer" className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-ink-2 hover:bg-soft hover:text-primary sm:inline-flex">
            Voir le site <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </header>
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  )
}
