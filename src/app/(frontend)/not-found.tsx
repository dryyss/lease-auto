import { ArrowRight, Calculator, CarFront, Phone } from 'lucide-react'
import Link from 'next/link'

import { PageHero } from '@/components/ui/PageHero'

/**
 * 404 : vraie page avec titre, H1 et chemins vers le stock. Next ajoute déjà le noindex.
 * Les anciennes adresses du site arrivent souvent ici : on ne perd pas le visiteur.
 */
export default function NotFound() {
  const exits = [
    { href: '/vehicules', icon: CarFront, title: 'Voir le stock', text: 'Véhicules contrôlés, garantis et finançables.' },
    { href: '/simulateur', icon: Calculator, title: 'Simuler une mensualité', text: 'LOA, LLD ou crédit, en direct.' },
    { href: '/contact', icon: Phone, title: 'Nous contacter', text: 'Un conseiller vous répond et vous rappelle.' },
  ]
  return (
    <>
      <title>Page introuvable | Lease Auto</title>
      <PageHero compact eyebrow="Erreur 404" title="Cette page n’existe plus" intro="L’adresse a peut-être changé avec le nouveau site. Voici les pages les plus demandées." />
      <div className="container-site pb-16">
        <ul className="grid gap-4 sm:grid-cols-3">
          {exits.map(({ href, icon: Icon, title, text }) => (
            <li key={href}>
              <Link href={href} className="group card hover-lift flex h-full flex-col p-6">
                <Icon className="mb-4 size-6 text-accent" aria-hidden />
                <span className="font-black text-primary">{title}</span>
                <span className="mt-1 text-sm text-ink-2">{text}</span>
                <span className="mt-4 flex items-center gap-1.5 text-sm font-bold text-accent">
                  Y aller <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-center">
          <Link href="/" className="btn-ghost">Retour à l’accueil</Link>
        </p>
      </div>
    </>
  )
}
