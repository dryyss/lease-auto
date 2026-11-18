import { Clock, FileWarning, Phone } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/gestion/ui'
import { ago, REQUEST_STATUS_TONE, requestStatusLabel, telHref } from '@/lib/gestion/labels'
import type { Request } from '@/payload-types'

import { fullName, hasMissingDocs, idOf, isLate, projectLine } from './format'

export type Row = Pick<
  Request,
  'id' | 'reference' | 'type' | 'status' | 'firstName' | 'lastName' | 'phone' | 'vehicle' | 'formula' | 'tradeIn' | 'missingDocuments' | 'assignedTo' | 'createdAt' | 'updatedAt'
>

/** Champs lus pour la liste et le tableau (le véhicule est réduit à son titre). */
export const ROW_SELECT = {
  reference: true,
  type: true,
  status: true,
  firstName: true,
  lastName: true,
  phone: true,
  vehicle: true,
  formula: true,
  tradeIn: { brand: true, model: true, year: true },
  missingDocuments: true,
  assignedTo: true,
  createdAt: true,
  updatedAt: true,
} as const
export const ROW_POPULATE = { vehicles: { title: true } } as const

function Flags({ r }: { r: Row }) {
  return (
    <>
      <Badge className={REQUEST_STATUS_TONE[r.status]}>{requestStatusLabel(r)}</Badge>
      {isLate(r) && (
        <Badge className="bg-accent-soft text-accent-dark">
          <Clock className="mr-1 size-3" aria-hidden /> En retard
        </Badge>
      )}
      {hasMissingDocs(r) && (
        <Badge className="bg-amber-100 text-amber-800">
          <FileWarning className="mr-1 size-3" aria-hidden /> Pièces manquantes
        </Badge>
      )}
    </>
  )
}

/** Ligne de la liste (carte sur mobile). Tout le bloc mène à la fiche ; le téléphone reste cliquable à part. */
export function RequestRow({ r, advisors }: { r: Row; advisors: Map<number, string> }) {
  const advisor = advisors.get(idOf(r.assignedTo) ?? -1)
  return (
    <li className="group relative flex flex-col gap-2 rounded-2xl border border-line bg-white p-4 transition hover:bg-soft/60 md:flex-row md:items-center md:gap-6 md:rounded-none md:border-0 md:px-5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/gestion/demandes/${r.id}`}
            className="font-black text-primary outline-none after:absolute after:inset-0 after:rounded-2xl group-hover:text-accent focus-visible:after:ring-3 focus-visible:after:ring-accent/40 md:after:rounded-none"
          >
            {fullName(r)}
          </Link>
          <Flags r={r} />
        </div>
        <p className="mt-1 truncate text-sm text-ink-2">{projectLine(r)}</p>
        <p className="mt-0.5 text-xs text-ink-3">
          Reçue {ago(r.createdAt)} · {advisor ?? 'Personne ne suit ce dossier'} · {r.reference}
        </p>
      </div>
      <a
        href={telHref(r.phone)}
        className="relative z-10 inline-flex w-fit items-center gap-1.5 rounded-xl px-2 py-1 text-sm font-bold whitespace-nowrap text-primary hover:bg-white hover:text-accent"
      >
        <Phone className="size-4" aria-hidden /> {r.phone}
        <span className="sr-only">(appeler {fullName(r)})</span>
      </a>
    </li>
  )
}

/** Carte du tableau kanban. */
export function KanbanCard({ r, advisors }: { r: Row; advisors: Map<number, string> }) {
  const advisor = advisors.get(idOf(r.assignedTo) ?? -1)
  return (
    <li>
      <Link
        href={`/gestion/demandes/${r.id}`}
        className="block rounded-xl border border-line bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-ink-3 hover:shadow-md focus-visible:ring-3 focus-visible:ring-accent/40 focus-visible:outline-none"
      >
        <span className="block font-black text-primary">{fullName(r)}</span>
        <span className="mt-0.5 block truncate text-xs text-ink-2">{projectLine(r)}</span>
        <span className="mt-2 flex flex-wrap gap-1.5">
          {isLate(r) && <Badge className="bg-accent-soft text-accent-dark">En retard</Badge>}
          {hasMissingDocs(r) && <Badge className="bg-amber-100 text-amber-800">Pièces manquantes</Badge>}
        </span>
        <span className="mt-1.5 block text-[11px] text-ink-3">
          Reçue {ago(r.createdAt)}
          {advisor ? ` · ${advisor}` : ''}
        </span>
      </Link>
    </li>
  )
}
