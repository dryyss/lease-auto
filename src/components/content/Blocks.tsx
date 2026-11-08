import { Check, ChevronDown, Minus } from 'lucide-react'
import Link from 'next/link'

import { SectionHeader } from '@/components/home/Sections'
import { COMPARE_ROWS, type Item, type QA } from '@/lib/page-content'

/** Grille de cartes « titre + texte » (étapes numérotées si `numbered`). */
export function CardsSection({
  eyebrow,
  title,
  intro,
  items,
  numbered = false,
  soft = false,
  columns = 3,
}: {
  eyebrow: string
  title: string
  intro?: string
  items: Item[]
  numbered?: boolean
  soft?: boolean
  columns?: 2 | 3 | 4
}) {
  const grid = { 2: 'md:grid-cols-2', 3: 'md:grid-cols-2 lg:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' }[columns]
  const List = numbered ? 'ol' : 'ul'
  return (
    <section className={`section ${soft ? 'section-soft' : ''}`}>
      <div className="container-site">
        <SectionHeader eyebrow={eyebrow} title={title} intro={intro} />
        <List className={`grid gap-5 ${grid}`}>
          {items.map((s, i) => (
            <li key={s.title} className="card p-6">
              {numbered && <span className="mb-4 flex size-10 items-center justify-center rounded-full bg-primary text-sm font-black text-white">{i + 1}</span>}
              <h3 className="mb-2 font-black text-primary">{s.title}</h3>
              <p className="text-sm leading-relaxed text-ink-2">{s.text}</p>
            </li>
          ))}
        </List>
      </div>
    </section>
  )
}

/** Questions-réponses rédigées dans le code, avec leurs données structurées FAQPage pour Google. */
export function QuestionsSection({ eyebrow = 'Questions fréquentes', title, items, soft = false }: { eyebrow?: string; title: string; items: QA[]; soft?: boolean }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }
  return (
    <section className={`section ${soft ? 'section-soft' : ''}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <div className="container-site max-w-4xl">
        <SectionHeader eyebrow={eyebrow} title={title} />
        <div className="space-y-3">
          {items.map((f) => (
            <details key={f.q} className="group card overflow-hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-bold text-primary sm:p-6 [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronDown className="size-5 shrink-0 text-accent transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-ink-2 sm:px-6 sm:pb-6">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

/** Paragraphes de fond (« En détail »), en colonne de lecture. */
export function ProseSection({ eyebrow, title, paragraphs, soft = false }: { eyebrow: string; title: string; paragraphs: string[]; soft?: boolean }) {
  return (
    <section className={`section ${soft ? 'section-soft' : ''}`}>
      <div className="container-site max-w-3xl">
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h2 className="mb-6 text-3xl font-black text-primary">{title}</h2>
        <div className="space-y-4 text-base leading-relaxed text-ink-2">
          {paragraphs.map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  )
}

const Cell = ({ v }: { v: string | boolean }) =>
  typeof v === 'boolean' ? (
    v ? (
      <Check className="mx-auto size-5 text-emerald-600" aria-label="Oui" />
    ) : (
      <Minus className="mx-auto size-5 text-ink-3" aria-label="Non" />
    )
  ) : (
    <span>{v}</span>
  )

/** Tableau comparatif LOA / LLD / crédit, la formule de la page mise en avant. */
export function FormulaCompare({ highlight, soft = false }: { highlight?: 'loa' | 'lld' | 'credit'; soft?: boolean }) {
  const cols = [
    { key: 'loa', label: 'LOA', href: '/financement/loa' },
    { key: 'lld', label: 'LLD', href: '/financement/lld' },
    { key: 'credit', label: 'Crédit auto', href: '/financement/credit' },
  ] as const
  return (
    <section className={`section ${soft ? 'section-soft' : ''}`}>
      <div className="container-site max-w-5xl">
        <SectionHeader eyebrow="Comparatif" title="LOA, LLD ou crédit : laquelle choisir ?" intro="Les trois formules financent le même véhicule. Ce qui change : à qui il appartient, ce que vous payez chaque mois et ce qui se passe à la fin." />
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">Comparaison des formules de financement</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="p-4 font-bold text-ink-3">Critère</th>
                {cols.map((c) => (
                  <th key={c.key} scope="col" className={`p-4 text-center font-black ${c.key === highlight ? 'bg-accent-soft text-accent-dark' : 'text-primary'}`}>
                    <Link href={c.href} className="hover:underline">{c.label}</Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((r) => (
                <tr key={r.label} className="border-b border-line last:border-0">
                  <th scope="row" className="p-4 font-semibold text-primary">{r.label}</th>
                  {cols.map((c) => (
                    <td key={c.key} className={`p-4 text-center text-ink-2 ${c.key === highlight ? 'bg-accent-soft/40' : ''}`}>
                      <Cell v={r[c.key]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
