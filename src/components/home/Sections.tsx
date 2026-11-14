import { RichText } from '@payloadcms/richtext-lexical/react'
import { ArrowRight, BadgeCheck, ChevronDown, FileSignature, KeyRound, ShieldCheck, Star, Truck, Wallet } from 'lucide-react'
import Link from 'next/link'

import { mediaSrc } from '@/lib/media'
import type { Faq, Homepage, Media, Review } from '@/payload-types'

import { HeroStage, type HeroCar } from './HeroStage'

export function SectionHeader({ eyebrow, title, intro, center = true }: { eyebrow: string; title: React.ReactNode; intro?: string; center?: boolean }) {
  return (
    <div className={`mb-8 sm:mb-10 ${center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}`}>
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h2 className="text-3xl font-black tracking-tight text-primary sm:text-4xl lg:text-5xl">{title}</h2>
      {intro && <p className="mt-4 text-base text-ink-2 sm:text-lg">{intro}</p>}
    </div>
  )
}

const DEFAULT_TITLE = 'Votre voiture d’occasion contrôlée, financée en LOA, LLD ou crédit'
const DEFAULT_SUBTITLE = 'Réponse sous 48 h, garantie 12 mois, livraison partout en France.'
const SAFE_SUBTITLE = 'Garantie 12 mois, livraison partout en France, dossier étudié avec vous.'

export function HomeHero({ hero, cars }: { hero: Homepage['hero']; cars: HeroCar[] }) {
  const image = typeof hero?.image === 'object' ? (hero.image as Media) : null
  const imageSrc = mediaSrc(image, 'large') || '/images/hero.jpg'
  const rawTitle = hero?.title?.trim()
  const title = !rawTitle || rawTitle === DEFAULT_TITLE ? 'Une offre claire. Sans surprise.' : rawTitle
  const rawSubtitle = hero?.subtitle?.trim()
  const subtitle = !rawSubtitle || rawSubtitle === DEFAULT_SUBTITLE ? SAFE_SUBTITLE : rawSubtitle

  return <HeroStage fallback={imageSrc} title={title} subtitle={subtitle} cars={cars} />
}

const FORMULAS = [
  {
    href: '/financement/loa',
    icon: KeyRound,
    name: 'LOA',
    title: 'Location avec option d’achat',
    text: 'En fin de contrat, vous achetez le véhicule au prix fixé dès la signature, ou vous le rendez.',
    points: ['De 12 à 84 mois', 'Option d’achat fixée dès la signature', 'Particuliers et professionnels'],
  },
  {
    href: '/financement/lld',
    icon: FileSignature,
    name: 'LLD',
    title: 'Location longue durée',
    text: 'Un loyer fixe pour un véhicule récent, sans vous soucier de la revente. Idéal pour les pros et VTC.',
    points: ['Loyer tout compris possible', 'Restitution en fin de contrat', 'Avantages fiscaux pour les pros'],
  },
  {
    href: '/financement/credit',
    icon: Wallet,
    name: 'Crédit auto',
    title: 'Crédit affecté',
    text: 'Vous êtes propriétaire dès la livraison et remboursez en mensualités fixes, sans surprise.',
    points: ['De 12 à 72 mois', 'Mensualités fixes', 'Propriétaire immédiatement'],
  },
]

export function FormulasSection() {
  return (
    <section className="section section-soft">
      <div className="container-site">
        <SectionHeader
          eyebrow="Nos financements"
          title={<>Trois formules, <span className="gradient-text">un dossier étudié</span></>}
          intro="Chaque dossier est étudié au cas par cas : salariés, indépendants, VTC et sociétés."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {FORMULAS.map(({ href, icon: Icon, name, title, text, points }) => (
            <Link key={href} href={href} className="group card hover-lift flex flex-col p-6 md:p-5 lg:p-7">
              <span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                <Icon className="size-6" aria-hidden />
              </span>
              <p className="eyebrow mb-1">{name}</p>
              <h3 className="mb-3 text-xl font-black text-primary">{title}</h3>
              <p className="mb-5 text-sm leading-relaxed text-ink-2">{text}</p>
              <ul className="mb-6 space-y-2 text-sm text-ink-2">
                {points.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                    {p}
                  </li>
                ))}
              </ul>
              <span className="mt-auto flex items-center gap-1.5 text-sm font-bold text-accent">
                Découvrir <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

const DEFAULT_STEPS = [
  { title: 'Choisissez', text: 'Parcourez le stock ou dites-nous ce que vous cherchez.' },
  { title: 'Simulez', text: 'Formule, apport et durée : votre mensualité en direct.' },
  { title: 'Envoyez votre dossier', text: 'Pièces déposées en ligne, en toute sécurité.' },
  { title: 'Recevez la réponse', text: 'Un conseiller étudie votre dossier et vous explique l’offre avant toute signature.' },
  { title: 'Roulez', text: 'Retrait à l’agence ou livraison chez vous.' },
]

export function StepsSection({ steps }: { steps?: Homepage['steps'] }) {
  const list = steps?.length ? steps : DEFAULT_STEPS
  return (
    <section className="section">
      <div className="container-site">
        <SectionHeader eyebrow="Comment ça marche" title="De la simulation aux clés, en 5 étapes" />
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {list.map((s, i) => (
            <li key={s.title} className="card relative p-6">
              <span className="mb-4 flex size-10 items-center justify-center rounded-full bg-primary text-sm font-black text-white">{i + 1}</span>
              <h3 className="mb-2 font-black text-primary">{s.title}</h3>
              <p className="text-sm leading-relaxed text-ink-2">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

const DEFAULT_STATS = [
  { value: '12 mois', label: 'de garantie incluse' },
  { value: 'Étude', label: 'personnalisée de chaque dossier' },
  { value: '100 %', label: 'des véhicules contrôlés' },
  { value: 'France', label: 'livraison partout' },
]

export function StatsBand({ stats }: { stats?: Homepage['stats'] }) {
  const list = stats?.length ? stats : DEFAULT_STATS
  const icons = [ShieldCheck, BadgeCheck, Star, Truck]
  return (
    <section className="gradient-cta py-12 sm:py-16">
      <div className="container-site relative grid grid-cols-2 gap-8 lg:grid-cols-4">
        {list.map((s, i) => {
          const Icon = icons[i % icons.length]
          return (
            <div key={s.label} className="text-center">
              <Icon className="mx-auto mb-3 size-6 text-accent-on-dark" aria-hidden />
              <p className="text-3xl font-black tracking-tight sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-xs font-semibold tracking-wider text-white/60 uppercase">{s.label}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function ReviewsSection({ reviews, googleUrl }: { reviews: Review[]; googleUrl?: string | null }) {
  if (!reviews.length) return null
  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  return (
    <section className="section section-soft">
      <div className="container-site">
        <SectionHeader
          eyebrow="Avis clients"
          title="Ils ont roulé avec Lease Auto"
          intro={`Note moyenne ${average.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}/5 sur les avis Google mis en avant.`}
        />
        <div className="grid gap-5 md:grid-cols-3">
          {reviews.map((r) => (
            <figure key={r.id} className="card flex flex-col p-6">
              <div className="mb-3 flex gap-0.5" aria-label={`${r.rating} sur 5`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className={`size-4 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-line'}`} aria-hidden />
                ))}
              </div>
              <blockquote className="mb-5 flex-1 text-sm leading-relaxed text-ink-2">« {r.text} »</blockquote>
              <figcaption className="text-sm">
                <span className="font-bold text-primary">{r.firstName}</span>
                <span className="text-ink-3"> · {new Date(r.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} · Google</span>
              </figcaption>
            </figure>
          ))}
        </div>
        {googleUrl && (
          <p className="mt-8 text-center">
            <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost">
              Voir tous les avis sur Google
            </a>
          </p>
        )}
      </div>
    </section>
  )
}

export function FaqSection({ faqs }: { faqs: Faq[] }) {
  if (!faqs.length) return null
  return (
    <section className="section">
      <div className="container-site max-w-4xl">
        <SectionHeader eyebrow="Questions fréquentes" title="Vos questions, nos réponses" />
        <div className="space-y-3">
          {faqs.map((f) => (
            <details key={f.id} className="group card overflow-hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-bold text-primary sm:p-6 [&::-webkit-details-marker]:hidden">
                {f.question}
                <ChevronDown className="size-5 shrink-0 text-accent transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <div className="prose-sm px-5 pb-5 text-sm leading-relaxed text-ink-2 sm:px-6 sm:pb-6 [&_p+p]:mt-3">
                <RichText data={f.answer} />
              </div>
            </details>
          ))}
        </div>
        <p className="mt-8 text-center">
          <Link href="/faq" className="text-sm font-bold text-accent hover:underline">
            Toutes les questions
          </Link>
        </p>
      </div>
    </section>
  )
}
