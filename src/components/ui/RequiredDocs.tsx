import { Briefcase, FileText, UserRound } from 'lucide-react'

import {
  BUSINESS_DOCS,
  HOSTED_DOCS,
  PERSONAL_DOCS,
  type RequiredDoc,
} from '@/lib/required-documents'

const List = ({ docs }: { docs: RequiredDoc[] }) => (
  <ul className="space-y-2">
    {docs.map((d) => (
      <li key={d.label} className="flex gap-2.5">
        <span aria-hidden className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-accent" />
        <span>{d.label}</span>
      </li>
    ))}
  </ul>
)

/** Pièces à préparer pour l'étude du dossier (affiche de l'agence), sur deux colonnes sous le formulaire. */
export function RequiredDocs() {
  return (
    <section aria-labelledby="pieces" className="card p-6 text-sm text-ink-2 sm:p-8">
      <div className="mb-6 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft">
          <FileText className="size-5 text-accent" aria-hidden />
        </span>
        <div>
          <h2 id="pieces" className="text-lg font-black text-primary">
            Pièces à préparer
          </h2>
          <p>Rassemblez-les avant de commencer : l’étude de votre dossier ira plus vite.</p>
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl bg-soft p-5">
          <p className="mb-3 flex items-center gap-2 font-bold text-primary">
            <UserRound className="size-4 text-accent" aria-hidden /> Particuliers
          </p>
          <List docs={PERSONAL_DOCS} />
          <p className="mt-4 mb-2 text-xs font-bold text-primary">Si vous êtes hébergé(e)</p>
          <List docs={HOSTED_DOCS} />
        </div>
        <div className="rounded-2xl bg-soft p-5">
          <p className="mb-3 flex items-center gap-2 font-bold text-primary">
            <Briefcase className="size-4 text-accent" aria-hidden /> Indépendants et entreprises
          </p>
          <List docs={BUSINESS_DOCS} />
        </div>
      </div>
    </section>
  )
}
