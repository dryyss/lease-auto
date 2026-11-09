import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'
import { CheckCircle2 } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CardsSection, FormulaCompare, ProseSection, QuestionsSection } from '@/components/content/Blocks'
import { SectionHeader } from '@/components/home/Sections'
import { QuickSimulator } from '@/components/home/QuickSimulator'
import { CreditNotice } from '@/components/ui/CreditNotice'
import { PageHero } from '@/components/ui/PageHero'
import type { Formula } from '@/lib/finance'
import { FORMULAS } from '@/lib/formulas-content'
import { DOCUMENTS, FORMULA_EXTRA, PURCHASE_STEPS } from '@/lib/page-content'
import { payloadClient } from '@/lib/payload'
import { getFormulaRates } from '@/lib/rates'

type Props = { params: Promise<{ formule: string }> }

export const revalidate = 3600
export const dynamicParams = false
export const generateStaticParams = () => Object.keys(FORMULAS).map((formule) => ({ formule }))

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = FORMULAS[(await params).formule as Formula]
  return c ? { title: c.metaTitle, description: c.metaDescription, alternates: { canonical: `/financement/${c.slug}` } } : {}
}

export default async function FormulaPage({ params }: Props) {
  const formula = (await params).formule as Formula
  const c = FORMULAS[formula]
  if (!c) notFound()
  const extra = FORMULA_EXTRA[formula]

  const payload = await payloadClient()
  const [rates, faqs] = await Promise.all([
    getFormulaRates([formula]),
    payload.find({ collection: 'faqs', where: { category: { in: [formula, 'dossier'] } }, sort: 'order', limit: 8, depth: 0 }),
  ])

  return (
    <>
      <PageHero eyebrow={`Financement ${c.name}`} title={c.title} intro={c.intro} crumbs={[{ label: 'Financement' }, { label: c.name }]}>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/demande?formule=${formula}`} className="btn-primary">Faire ma demande en {c.name}</Link>
          <Link href={`/vehicules`} className="btn-ghost">Voir les véhicules</Link>
        </div>
      </PageHero>

      <section className="section section-soft pt-0 sm:pt-0 lg:pt-0">
        <div className="container-site">
          <SectionHeader eyebrow="Le principe" title="Comment ça marche ?" />
          <ol className="grid gap-5 md:grid-cols-3">
            {c.how.map((s, i) => (
              <li key={s.title} className="card p-6">
                <span className="mb-4 flex size-10 items-center justify-center rounded-full bg-primary text-sm font-black text-white">{i + 1}</span>
                <h3 className="mb-2 font-black text-primary">{s.title}</h3>
                <p className="text-sm leading-relaxed text-ink-2">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {rates.length > 0 && (
        <section className="section">
          <div className="container-site max-w-6xl">
            <SectionHeader eyebrow="Simulateur" title={`Votre mensualité en ${c.name}`} />
            <QuickSimulator rates={rates} />
          </div>
        </section>
      )}

      <ProseSection eyebrow={`La ${c.name} en détail`} title={`Comprendre la ${c.name}`} paragraphs={extra.details} soft />

      <section className="section">
        <div className="container-site grid gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-3">Les avantages</p>
            <h2 className="mb-6 text-3xl font-black text-primary">Pourquoi choisir la {c.name} ?</h2>
            <ul className="space-y-3">
              {c.pros.map((p) => (
                <li key={p} className="flex gap-3 text-ink-2">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden /> {p}
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-2xl bg-accent-soft p-5 text-sm font-semibold text-accent-dark">{c.forWho}</p>
          </div>
          <div className="card p-7">
            <p className="eyebrow mb-3">Les conditions</p>
            <h2 className="mb-5 text-2xl font-black text-primary">Ce qu’il faut savoir</h2>
            <ul className="space-y-3 text-sm text-ink-2">
              {c.conditions.map((p) => (
                <li key={p} className="flex gap-2.5">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden /> {p}
                </li>
              ))}
            </ul>
            <Link href="/faq" className="mt-6 inline-block text-sm font-bold text-accent hover:underline">Pièces à fournir et questions fréquentes</Link>
          </div>
        </div>
      </section>

      <CardsSection eyebrow="Fin de contrat" title={extra.endTitle} items={extra.end} soft />
      <FormulaCompare highlight={formula} />
      <CardsSection eyebrow="Chez Lease Auto" title="Votre financement en 4 étapes" items={PURCHASE_STEPS} numbered columns={4} soft />
      <CardsSection eyebrow="Votre dossier" title="Les pièces à préparer" intro="Vous les envoyez en ligne, en photo ou en PDF, depuis votre demande de financement." items={DOCUMENTS} />

      <QuestionsSection
        title={`Vos questions sur la ${c.name}`}
        soft
        items={[...extra.faq, ...faqs.docs.map((f) => ({ q: f.question, a: convertLexicalToPlaintext({ data: f.answer }) }))]}
      />
      <div className="container-site pb-12">
        <CreditNotice formulas={[formula]} className="border-t border-line pt-6" />
      </div>
    </>
  )
}
