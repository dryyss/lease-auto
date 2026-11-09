import { FileText } from 'lucide-react'

import { BUSINESS_DOCS, HOSTED_DOCS, PERSONAL_DOCS, type RequiredDoc } from '@/lib/required-documents'

const List = ({ docs }: { docs: RequiredDoc[] }) => (
  <ul className="mt-2 space-y-1.5">
    {docs.map((d) => (
      <li key={d.label} className="flex gap-2">
        <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
        <span>{d.label}</span>
      </li>
    ))}
  </ul>
)

/** Pièces à préparer pour l'étude du dossier (affiche de l'agence). */
export function RequiredDocs() {
  return (
    <div className="card p-6 text-sm text-ink-2">
      <p className="flex items-center gap-2 font-black text-primary">
        <FileText className="size-5 shrink-0 text-accent" aria-hidden /> Pièces à préparer
      </p>
      <p className="mt-4 text-xs font-bold tracking-wide text-primary uppercase">Particuliers</p>
      <List docs={PERSONAL_DOCS} />
      <p className="mt-3 text-xs text-ink-2">Si vous êtes hébergé(e) :</p>
      <List docs={HOSTED_DOCS} />
      <p className="mt-5 text-xs font-bold tracking-wide text-primary uppercase">Indépendants et entreprises</p>
      <List docs={BUSINESS_DOCS} />
    </div>
  )
}
