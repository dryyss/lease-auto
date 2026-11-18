import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { btn, field } from '@/components/gestion/ui'

/** Pagination Précédent / Suivant des listes de la console (composant serveur : `href` est une fonction). */
export function Pager({
  page,
  pages,
  href,
  total,
}: {
  page: number
  pages: number
  href: (page: number) => string
  total?: string
}) {
  if (pages <= 1) return null
  return (
    <nav aria-label="Pages" className="mt-6 flex items-center justify-between gap-3 text-sm">
      {page > 1 ? (
        <Link href={href(page - 1)} className={btn.ghost}>
          <ChevronLeft className="size-4" aria-hidden /> Précédent
        </Link>
      ) : (
        <span />
      )}
      <span className="text-center text-ink-2">
        Page {page} sur {pages}
        {total ? ` · ${total}` : ''}
      </span>
      {page < pages ? (
        <Link href={href(page + 1)} className={btn.ghost}>
          Suivant <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  )
}

/** Champ de recherche d'une liste (formulaire GET : garde les autres paramètres en champs cachés). */
export function SearchBox({
  action,
  id,
  q,
  placeholder,
  keep = {},
}: {
  action: string
  id: string
  q: string
  placeholder: string
  keep?: Record<string, string | undefined>
}) {
  return (
    <form action={action} role="search" className="flex w-full max-w-xl gap-2">
      {Object.entries(keep).map(([k, v]) =>
        v ? <input key={k} type="hidden" name={k} value={v} /> : null,
      )}
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <input
        id={id}
        name="q"
        type="search"
        defaultValue={q}
        placeholder={placeholder}
        className={field}
      />
      <button type="submit" className={`${btn.dark} shrink-0`}>
        Rechercher
      </button>
    </form>
  )
}
