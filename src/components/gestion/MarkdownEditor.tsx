'use client'

import { Bold, Heading2, Italic, Link2, List, ListOrdered } from 'lucide-react'
import { useRef } from 'react'

import { field } from './ui'

/**
 * Éditeur de texte de la console : Markdown simple avec une barre d'outils.
 * Le serveur convertit en texte riche Payload (src/lib/gestion/richtext.ts).
 */
export function MarkdownEditor({ id, value, onChange, rows = 10, placeholder }: { id: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null)

  /** Entoure la sélection (gras, italique, lien) ou préfixe les lignes sélectionnées (titre, listes). */
  const apply = (kind: 'bold' | 'italic' | 'h2' | 'ul' | 'ol' | 'link') => {
    const t = ref.current
    if (!t) return
    const { selectionStart: s, selectionEnd: e } = t
    const sel = value.slice(s, e)
    let next = value
    let cursor = e
    if (kind === 'bold' || kind === 'italic') {
      const mark = kind === 'bold' ? '**' : '*'
      const text = sel || (kind === 'bold' ? 'texte en gras' : 'texte en italique')
      next = value.slice(0, s) + mark + text + mark + value.slice(e)
      cursor = s + mark.length + text.length + mark.length
    } else if (kind === 'link') {
      const text = sel || 'texte du lien'
      next = `${value.slice(0, s)}[${text}](https://)${value.slice(e)}`
      cursor = s + text.length + 3 + 8
    } else {
      const lineStart = value.lastIndexOf('\n', s - 1) + 1
      const block = value.slice(lineStart, e) || 'Votre texte'
      const lines = block.split('\n').map((l, i) => {
        const clean = l.replace(/^(#{1,6}\s+|[-*]\s+|\d+\.\s+)/, '')
        return kind === 'h2' ? `## ${clean}` : kind === 'ul' ? `- ${clean}` : `${i + 1}. ${clean}`
      })
      next = value.slice(0, lineStart) + lines.join('\n') + value.slice(Math.max(e, lineStart))
      cursor = lineStart + lines.join('\n').length
    }
    onChange(next)
    requestAnimationFrame(() => {
      t.focus()
      t.setSelectionRange(cursor, cursor)
    })
  }

  const tools = [
    { k: 'h2', label: 'Intertitre', Icon: Heading2 },
    { k: 'bold', label: 'Gras', Icon: Bold },
    { k: 'italic', label: 'Italique', Icon: Italic },
    { k: 'ul', label: 'Liste à puces', Icon: List },
    { k: 'ol', label: 'Liste numérotée', Icon: ListOrdered },
    { k: 'link', label: 'Lien', Icon: Link2 },
  ] as const

  return (
    <div className="overflow-hidden rounded-xl border border-line focus-within:border-accent focus-within:ring-3 focus-within:ring-accent/15">
      <div className="flex flex-wrap gap-1 border-b border-line bg-soft px-2 py-1.5" role="toolbar" aria-label="Mise en forme">
        {tools.map(({ k, label, Icon }) => (
          <button key={k} type="button" onClick={() => apply(k)} title={label} aria-label={label} className="flex size-8 items-center justify-center rounded-lg text-ink-2 hover:bg-white hover:text-primary">
            <Icon className="size-4" aria-hidden />
          </button>
        ))}
        <span className="ml-auto self-center pr-1 text-[11px] text-ink-3">Une ligne vide sépare deux paragraphes.</span>
      </div>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${field} rounded-none border-0 font-mono text-[13px] leading-relaxed focus:ring-0`}
      />
    </div>
  )
}
