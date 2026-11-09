import Link from 'next/link'

/** SEO : fil d'Ariane lisible par Google (BreadcrumbList), même contenu que le fil affiché. */
export function breadcrumbJsonLd(crumbs: { label: string; href?: string }[]) {
  const base = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
  const items = [{ label: 'Accueil', href: '/' }, ...crumbs]
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      ...(c.href && { item: `${base}${c.href}` }),
    })),
  }).replace(/</g, '\\u003c')
}

/** Bandeau photo des pages intérieures : le fond du site, assombri, pour qu’aucune page ne s’ouvre sur du vide. */
export function PageHero({
  eyebrow,
  title,
  intro,
  crumbs,
  children,
  compact = false,
}: {
  eyebrow: string
  title: React.ReactNode
  intro?: string
  crumbs?: { label: string; href?: string }[]
  children?: React.ReactNode
  compact?: boolean
}) {
  return (
    <section className={`relative flex items-end overflow-hidden ${compact ? 'min-h-[34svh] pt-28 pb-8 sm:pt-32' : 'min-h-[42svh] pt-28 pb-10 sm:min-h-[46svh] sm:pt-32 sm:pb-12'}`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-black/55 to-black/30" />
      <div className="container-site relative text-white">
        {crumbs && (
          <nav aria-label="Fil d’Ariane" className="mb-3 text-xs text-white/70">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd(crumbs) }} />
            <Link href="/" className="inline-block py-1.5 hover:text-white">Accueil</Link>
            {crumbs.map((c) => (
              <span key={c.label}>
                {' / '}
                {c.href ? <Link href={c.href} className="inline-block py-1.5 hover:text-white">{c.label}</Link> : c.label}
              </span>
            ))}
          </nav>
        )}
        {/* Rouge de marque illisible sur photo sombre : surtitre en blanc, barre rouge pour l'accent */}
        <p className="eyebrow mb-3 flex items-center gap-2 text-white/85">
          <span aria-hidden className="h-0.5 w-6 rounded-full bg-accent" />
          {eyebrow}
        </p>
        <h1 className="max-w-3xl text-3xl font-black tracking-tight text-balance text-white sm:text-4xl lg:text-5xl">{title}</h1>
        {intro && <p className="mt-4 max-w-2xl text-base text-white/85 sm:text-lg">{intro}</p>}
        {children}
      </div>
    </section>
  )
}
