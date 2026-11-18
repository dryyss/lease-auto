import { ChevronRight, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

// Briques d'affichage de la console « Gestion » (structure Finarent, couleurs Lease Auto).
// Une seule façon de faire chaque chose : titre de page, carte, chiffre clé, badge, liste vide, bouton.

export function PageHeader({ title, subtitle, actions, back }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-ink-3 hover:text-primary">
            <ChevronRight className="size-4 rotate-180" aria-hidden /> {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-black text-primary sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

export function Card({ title, icon: Icon, action, children, className = '', padded = true }: { title?: ReactNode; icon?: LucideIcon; action?: ReactNode; children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={`rounded-2xl border border-line bg-white shadow-sm ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-black text-primary">
            {Icon && <Icon className="size-4.5 text-accent" aria-hidden />}
            {title}
          </h2>
          {action}
        </header>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  )
}

const GRADIENTS = {
  navy: 'from-primary to-primary-light shadow-primary/20',
  red: 'from-[#eb2427] to-accent-dark shadow-accent/25',
  green: 'from-emerald-500 to-emerald-700 shadow-emerald-500/20',
  slate: 'from-slate-500 to-slate-700 shadow-slate-500/20',
  sky: 'from-sky-500 to-sky-700 shadow-sky-500/20',
  amber: 'from-amber-500 to-amber-600 shadow-amber-500/20',
} as const

/** Chiffre clé en carte dégradée, cliquable (comme le tableau de bord Finarent). */
export function StatCard({ href, label, value, hint, icon: Icon, tone = 'navy' }: { href: string; label: string; value: ReactNode; hint?: ReactNode; icon: LucideIcon; tone?: keyof typeof GRADIENTS }) {
  return (
    <Link href={href} className={`group relative overflow-hidden rounded-2xl bg-linear-to-br p-5 text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl ${GRADIENTS[tone]}`}>
      <span aria-hidden className="absolute -top-6 -right-6 size-24 rounded-full bg-white/10" />
      <Icon className="mb-3 size-6 opacity-90" aria-hidden />
      <span className="block text-3xl leading-none font-black">{value}</span>
      <span className="mt-2 block text-sm font-semibold text-white/90">{label}</span>
      {hint && <span className="mt-0.5 block text-xs text-white/70">{hint}</span>}
    </Link>
  )
}

export function Badge({ children, className = 'bg-soft text-ink-2' }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${className}`}>{children}</span>
}

export function Empty({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-soft text-ink-3">
        <Icon className="size-6" aria-hidden />
      </span>
      <p className="font-bold text-primary">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-ink-2">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/** Boutons : principal (rouge, action du moment), sombre (marine), discret, danger. */
export const btn = {
  primary:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-accent/25 transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60',
  dark: 'inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60',
  ghost:
    'inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-primary transition hover:border-ink-3 hover:bg-soft disabled:cursor-not-allowed disabled:opacity-60',
  danger:
    'inline-flex items-center justify-center gap-2 rounded-xl border border-accent/30 bg-white px-4 py-2.5 text-sm font-bold text-accent transition hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-60',
  small: 'px-3! py-1.5! text-xs!',
}

/** Champ de formulaire de la console. */
export const field =
  'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-primary outline-none transition placeholder:text-ink-3 focus:border-accent focus:ring-3 focus:ring-accent/15'
export const label = 'mb-1.5 block text-xs font-bold text-ink-2'

/** Pastilles de filtre (liens) au-dessus d'une liste. */
export function FilterPills({ items }: { items: { href: string; label: string; count?: number; active: boolean }[] }) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Filtres">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={i.active ? 'page' : undefined}
          className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${i.active ? 'bg-primary text-white shadow-md shadow-primary/20' : 'border border-line bg-white text-ink-2 hover:border-ink-3 hover:text-primary'}`}
        >
          {i.label}
          {i.count != null && <span className={`rounded-full px-1.5 text-xs ${i.active ? 'bg-white/20' : 'bg-soft'}`}>{i.count}</span>}
        </Link>
      ))}
    </nav>
  )
}

/** Barre d'avancement d'un dossier : étapes franchies en vert, étape en cours en rouge. */
export function Steps({ steps, current, done = false, stopped = false }: { steps: readonly string[]; current: number; done?: boolean; stopped?: boolean }) {
  return (
    <ol className="grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
      {steps.map((s, i) => {
        const passed = !stopped && (i < current || done)
        const now = !stopped && !done && i === current
        return (
          <li key={s} aria-current={now ? 'step' : undefined}>
            <span className={`block h-1.5 rounded-full ${passed ? 'bg-emerald-500' : now ? 'bg-accent' : 'bg-line'}`} />
            <span className={`mt-1.5 block text-xs font-bold ${passed ? 'text-emerald-700' : now ? 'text-primary' : 'text-ink-3'}`}>{s}</span>
          </li>
        )
      })}
    </ol>
  )
}
