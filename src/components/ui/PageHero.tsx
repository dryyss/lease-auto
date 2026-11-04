import Link from 'next/link'

/** En-tête des pages intérieures, même style que l'accueil (halo marine/rouge, sur-titre, titre). */
export function PageHero({
  eyebrow,
  title,
  intro,
  crumbs,
  children,
}: {
  eyebrow: string
  title: React.ReactNode
  intro?: string
  crumbs?: { label: string; href?: string }[]
  children?: React.ReactNode
}) {
  return (
    <section className="relative overflow-hidden pt-28 pb-10 sm:pt-36 sm:pb-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(at 10% 20%, rgba(13,36,73,0.08) 0%, transparent 45%), radial-gradient(at 90% 30%, rgba(222,29,34,0.07) 0%, transparent 45%)' }}
      />
      <div className="container-site relative">
        {crumbs && (
          <nav aria-label="Fil d’Ariane" className="mb-4 text-xs text-ink-3">
            <Link href="/" className="hover:text-primary">Accueil</Link>
            {crumbs.map((c) => (
              <span key={c.label}>
                {' / '}
                {c.href ? <Link href={c.href} className="hover:text-primary">{c.label}</Link> : c.label}
              </span>
            ))}
          </nav>
        )}
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h1 className="max-w-3xl text-3xl font-black tracking-tight text-balance text-primary sm:text-4xl lg:text-5xl">{title}</h1>
        {intro && <p className="mt-5 max-w-2xl text-lg text-ink-2">{intro}</p>}
        {children}
      </div>
    </section>
  )
}
