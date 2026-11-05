'use client'

import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { ChevronDown, Search } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

export type FaqItem = {
  id: number
  question: string
  category: string
  text: string
  answer: SerializedEditorState
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')

/** Liste filtrable : thème et recherche, sans recharger la page. */
export function FaqExplorer({ items, categories }: { items: FaqItem[]; categories: { key: string; label: string }[] }) {
  const [query, setQuery] = useState('')
  const [theme, setTheme] = useState('all')
  const q = norm(query.trim())

  const visible = useMemo(
    () =>
      items.filter((item) => {
        if (theme !== 'all' && item.category !== theme) return false
        if (!q) return true
        return norm(`${item.question} ${item.text}`).includes(q)
      }),
    [items, q, theme],
  )

  const groups = categories
    .map((c) => ({ ...c, items: visible.filter((i) => i.category === c.key) }))
    .filter((g) => g.items.length)

  return (
    <div>
      <div className="card mb-6 p-4 sm:p-5">
        <label className="relative block">
          <span className="sr-only">Rechercher une question</span>
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher : LOA, justificatifs, garantie…"
            className="input-field pl-11"
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Thèmes">
          <button type="button" role="tab" aria-selected={theme === 'all'} onClick={() => setTheme('all')} className={pill(theme === 'all')}>
            Tout <span className="text-ink-3">{items.length}</span>
          </button>
          {categories.map((c) => {
            const n = items.filter((i) => i.category === c.key).length
            if (!n) return null
            return (
              <button key={c.key} type="button" role="tab" aria-selected={theme === c.key} onClick={() => setTheme(c.key)} className={pill(theme === c.key)}>
                {c.label} <span className="text-ink-3">{n}</span>
              </button>
            )
          })}
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-lg font-black text-primary">Aucune question ne correspond</p>
          <p className="mt-2 text-sm text-ink-2">Un conseiller répond sous 48 h ouvrées.</p>
          <Link href="/contact" className="btn-primary mt-5">
            Poser ma question
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map((g) => (
            <section key={g.key} id={g.key} className="scroll-mt-28">
              <h2 className="mb-4 text-2xl font-black text-primary">{g.label}</h2>
              <div className="space-y-3">
                {g.items.map((f) => (
                  <details key={f.id} className="group card overflow-hidden" open={q.length > 1 || undefined}>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-bold text-primary [&::-webkit-details-marker]:hidden">
                      {f.question}
                      <ChevronDown className="size-5 shrink-0 text-accent transition-transform group-open:rotate-180" aria-hidden />
                    </summary>
                    <div className="px-5 pb-5 text-[15px] leading-relaxed text-ink-2 [&_p]:mt-0 [&_p+p]:mt-3">
                      <RichText data={f.answer} />
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

const pill = (on: boolean) =>
  `rounded-full border px-3 py-1.5 text-xs font-bold transition ${on ? 'border-primary bg-primary text-white [&_span]:text-white/70' : 'border-line bg-white text-primary hover:border-primary'}`
