import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'
import type { Metadata } from 'next'

import { FaqExplorer } from '@/components/faq/FaqExplorer'
import { ContactAside } from '@/components/ui/ContactAside'
import { PageHero } from '@/components/ui/PageHero'
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: docs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: convertLexicalToPlaintext({ data: f.answer }) } })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <PageHero eyebrow="FAQ" title="Questions fréquentes" intro="LOA, LLD, crédit, justificatifs, livraison et garantie. Cherchez votre question, ou posez-la à un conseiller." crumbs={[{ label: 'FAQ' }]} />
      <div className="container-site grid items-start gap-8 py-10 pb-16 lg:grid-cols-[minmax(0,1fr)_320px]">
        {docs.length ? (
          <FaqExplorer
            categories={Object.entries(CATEGORIES).map(([key, label]) => ({ key, label }))}
            items={docs.map((f) => ({
              id: f.id,
              question: f.question,
              category: f.category,
              text: `${CATEGORIES[f.category] ?? ''} ${convertLexicalToPlaintext({ data: f.answer })}`,
              answer: f.answer,
            }))}
          />
        ) : (
          <p className="card p-6 text-ink-2">Les questions seront bientôt en ligne.</p>
        )}
        <ContactAside />
      </div>
    </>
  )
}
