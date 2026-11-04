import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'
import { ChevronDown } from 'lucide-react'
import type { Metadata } from 'next'

import { PageHero } from '@/components/ui/PageHero'
import { Prose } from '@/components/ui/Prose'
import { payloadClient } from '@/lib/payload'

export const metadata: Metadata = {
  title: 'Questions fréquentes',
  description: 'LOA, LLD, crédit auto, justificatifs, livraison et garantie : toutes les réponses à vos questions sur le financement de votre voiture d’occasion.',
  alternates: { canonical: '/faq' },
}

export const revalidate = 3600

const CATEGORIES: Record<string, string> = {
  general: 'Général',
  loa: 'LOA',
  lld: 'LLD',
  credit: 'Crédit auto',
  dossier: 'Dossier et justificatifs',
  livraison: 'Livraison et garantie',
}

/** PUB-18 : FAQ complète, balisée pour les résultats enrichis (SEO-05). */
export default async function FaqPage() {
  const payload = await payloadClient()
  const { docs } = await payload.find({ collection: 'faqs', sort: 'order', limit: 200, depth: 0 })
  const groups = Object.entries(CATEGORIES)
    .map(([key, label]) => ({ key, label, items: docs.filter((f) => f.category === key) }))
    .filter((g) => g.items.length)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: docs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: convertLexicalToPlaintext({ data: f.answer }) } })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <PageHero eyebrow="FAQ" title="Questions fréquentes" intro="Tout ce qu’il faut savoir avant de financer votre véhicule." crumbs={[{ label: 'FAQ' }]}>
        {groups.length > 1 && (
          <nav className="mt-8 flex flex-wrap gap-2" aria-label="Thèmes">
            {groups.map((g) => (
              <a key={g.key} href={`#${g.key}`} className="pill hover:border-accent">{g.label}</a>
            ))}
          </nav>
        )}
      </PageHero>
      <div className="container-site max-w-4xl space-y-12 pb-16">
        {groups.map((g) => (
          <section key={g.key} id={g.key} className="scroll-mt-28">
            <h2 className="mb-4 text-2xl font-black text-primary">{g.label}</h2>
            <div className="space-y-3">
              {g.items.map((f) => (
                <details key={f.id} className="group card overflow-hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-bold text-primary [&::-webkit-details-marker]:hidden">
                    {f.question}
                    <ChevronDown className="size-5 shrink-0 text-accent transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <Prose data={f.answer} className="px-5 pb-5 [&>div>p:first-child]:mt-0" />
                </details>
              ))}
            </div>
          </section>
        ))}
        {!groups.length && <p className="card p-6 text-ink-2">Les questions seront bientôt en ligne.</p>}
      </div>
    </>
  )
}
