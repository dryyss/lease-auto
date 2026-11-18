import { ChevronLeft, ChevronRight, Download, FolderOpen, KanbanSquare, List, Search } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import type { Where } from 'payload'

import { lateBefore, PER_PAGE } from '@/components/gestion/demandes/format'
import { KanbanCard, RequestRow, ROW_POPULATE, ROW_SELECT, type Row } from '@/components/gestion/demandes/RequestList'
import { loadTeam } from '@/components/gestion/demandes/team'
import { btn, Card, Empty, field, FilterPills, PageHeader } from '@/components/gestion/ui'
import { plural, REQUEST_TYPES } from '@/lib/gestion/labels'
import { requireStaff } from '@/lib/gestion/session'
import type { Request } from '@/payload-types'

export const metadata: Metadata = { title: 'Demandes' }

type Status = Request['status']
const STATUSES: { value: Status; label: string; column: string }[] = [
  { value: 'new', label: 'Nouvelles', column: 'Nouvelles' },
  { value: 'review', label: 'En étude', column: 'En étude / en cours' },
  { value: 'approved', label: 'Accords', column: 'Accords' },
  { value: 'delivered', label: 'Livrées / traitées', column: 'Livrées / traitées' },
  { value: 'refused', label: 'Refus', column: 'Refus / sans suite' },
]
const KANBAN_LIMIT = 30
// Paramètres d'URL partagés avec le tableau de bord et la recherche : ne pas les renommer.
const KEYS = ['q', 'statut', 'type', 'mes', 'pieces', 'retard', 'vue', 'tri', 'page'] as const
type Params = Partial<Record<(typeof KEYS)[number], string>>

export default async function DemandesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams
  const sp: Params = {}
  for (const k of KEYS) {
    const v = raw[k]
    const s = (Array.isArray(v) ? v[0] : v)?.trim()
    if (s) sp[k] = s
  }
  const statut = STATUSES.find((s) => s.value === sp.statut)?.value
  const type = sp.type && sp.type in REQUEST_TYPES ? (sp.type as Request['type']) : undefined
  const kanban = sp.vue === 'kanban'
  const page = Math.max(1, Math.floor(Number(sp.page)) || 1)

  /** Lien qui garde les filtres en cours (et revient à la page 1). */
  const href = (changes: Params) => {
    const next = new URLSearchParams()
    for (const k of KEYS) {
      const v = k in changes ? changes[k] : k === 'page' ? undefined : sp[k]
      if (v) next.set(k, v)
    }
    const s = next.toString()
    return s ? `/gestion/demandes?${s}` : '/gestion/demandes'
  }
  const toggle = (k: 'mes' | 'pieces' | 'retard') => href({ [k]: sp[k] ? undefined : '1' })

  const { payload, user } = await requireStaff()

  // Tous les filtres sauf le statut (qui sert aux compteurs et aux colonnes).
  const base: Where[] = []
  for (const word of (sp.q ?? '').split(/\s+/).filter(Boolean).slice(0, 5)) {
    base.push({ or: (['firstName', 'lastName', 'email', 'phone', 'reference'] as const).map((f) => ({ [f]: { contains: word } })) })
  }
  if (type) base.push({ type: { equals: type } })
  if (sp.mes) base.push({ assignedTo: { equals: user.id } })
  if (sp.pieces) base.push({ type: { equals: 'financing' } }, { missingDocuments: { equals: true } }, { status: { in: ['new', 'review'] } })
  if (sp.retard) base.push({ status: { equals: 'new' } }, { createdAt: { less_than: lateBefore() } })
  const where = (...more: Where[]): Where => ({ and: [...base, ...more] })
  const byStatus = (s: Status): Where => ({ status: { equals: s } })

  const find = (w: Where, sort: string, p: number, limit = PER_PAGE) =>
    payload.find({ collection: 'requests', where: w, sort, page: p, limit, depth: 1, select: ROW_SELECT, populate: ROW_POPULATE, user, overrideAccess: false })

  const [team, all, ...perStatus] = await Promise.all([
    loadTeam(payload),
    payload.count({ collection: 'requests', where: where(), user, overrideAccess: false }),
    ...STATUSES.map((s) => payload.count({ collection: 'requests', where: where(byStatus(s.value)), user, overrideAccess: false })),
  ])
  const counts = Object.fromEntries(STATUSES.map((s, i) => [s.value, perStatus[i].totalDocs])) as Record<Status, number>
  const advisors = new Map(team.map((m) => [m.id, m.name]))

  let rows: Row[] = []
  let total = 0
  let columns: { status: (typeof STATUSES)[number]; rows: Row[] }[] = []

  if (kanban) {
    const results = await Promise.all(STATUSES.map((s) => find(where(byStatus(s.value)), s.value === 'new' ? 'createdAt' : '-updatedAt', 1, KANBAN_LIMIT)))
    columns = STATUSES.map((s, i) => ({ status: s, rows: results[i].docs as Row[] }))
  } else if (sp.tri === 'recent' || statut) {
    // Tri simple : les plus récentes, ou les nouvelles par ancienneté, ou le dernier mouvement d'abord.
    const sort = sp.tri === 'recent' ? '-createdAt' : statut === 'new' ? 'createdAt' : '-updatedAt'
    const r = await find(where(...(statut ? [byStatus(statut)] : [])), sort, page)
    rows = r.docs as Row[]
    total = r.totalDocs
  } else {
    // Par défaut : les nouvelles d'abord (la plus ancienne en tête), puis les autres par dernier mouvement.
    // Deux requêtes mises bout à bout, paginées ensemble.
    total = all.totalDocs
    const nNew = counts.new
    const offset = (page - 1) * PER_PAGE
    if (offset < nNew) rows = (await find(where(byStatus('new')), 'createdAt', page)).docs as Row[]
    const need = PER_PAGE - rows.length
    const start = Math.max(0, offset - nNew)
    if (need > 0 && start < total - nNew) {
      const notNew = where({ status: { not_equals: 'new' } })
      const first = Math.floor(start / PER_PAGE) + 1
      const skip = start % PER_PAGE
      const a = await find(notNew, '-updatedAt', first)
      let more = a.docs.slice(skip) as Row[]
      if (skip + need > PER_PAGE && a.hasNextPage) more = more.concat((await find(notNew, '-updatedAt', first + 1)).docs as Row[])
      rows = rows.concat(more.slice(0, need))
    }
  }
  const pages = Math.max(1, Math.ceil(total / PER_PAGE))
  const filtered = Boolean(sp.q || type || sp.mes || sp.pieces || sp.retard || statut)

  return (
    <>
      <PageHeader
        title="Demandes"
        subtitle={`${plural(kanban ? all.totalDocs : total, 'demande')}${filtered ? ' avec ces filtres' : ''}.`}
        actions={
          <>
            <nav aria-label="Affichage" className="inline-flex rounded-xl border border-line bg-white p-1">
              {[
                { on: !kanban, label: 'Liste', icon: List, to: href({ vue: undefined }) },
                { on: kanban, label: 'Tableau', icon: KanbanSquare, to: href({ vue: 'kanban' }) },
              ].map((v) => (
                <Link
                  key={v.label}
                  href={v.to}
                  aria-current={v.on ? 'page' : undefined}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold transition ${v.on ? 'bg-primary text-white' : 'text-ink-2 hover:text-primary'}`}
                >
                  <v.icon className="size-4" aria-hidden /> {v.label}
                </Link>
              ))}
            </nav>
            {/* Fichier CSV (route /gestion/export/demandes) : vrai lien de téléchargement. */}
            <a href={`/gestion/export/demandes?${new URLSearchParams((['q', 'statut', 'type', 'mes', 'pieces', 'retard'] as const).flatMap((k) => (sp[k] ? [[k, String(sp[k])]] : [])))}`} className={btn.ghost} download>
              <Download className="size-4" aria-hidden /> Exporter
            </a>
          </>
        }
      />

      <div className="mb-5 space-y-3">
        <form action="/gestion/demandes" role="search" className="flex max-w-xl gap-2">
          {KEYS.filter((k) => k !== 'q' && k !== 'page' && sp[k]).map((k) => (
            <input key={k} type="hidden" name={k} value={sp[k]} />
          ))}
          <label htmlFor="demandes-q" className="sr-only">
            Rechercher une demande
          </label>
          <input id="demandes-q" name="q" type="search" defaultValue={sp.q} placeholder="Nom, e-mail, téléphone ou référence" className={field} />
          <button type="submit" className={`${btn.dark} shrink-0`}>
            <Search className="size-4" aria-hidden /> <span className="max-sm:sr-only">Rechercher</span>
          </button>
        </form>

        {!kanban && (
          <FilterPills
            items={[
              { href: href({ statut: undefined }), label: 'Toutes', count: all.totalDocs, active: !statut },
              ...STATUSES.map((s) => ({ href: href({ statut: s.value }), label: s.label, count: counts[s.value], active: statut === s.value })),
            ]}
          />
        )}
        <FilterPills
          items={[
            ...(Object.keys(REQUEST_TYPES) as Request['type'][]).map((t) => ({
              href: href({ type: type === t ? undefined : t }),
              label: REQUEST_TYPES[t],
              active: type === t,
            })),
            { href: toggle('mes'), label: 'Mes dossiers', active: !!sp.mes },
            { href: toggle('pieces'), label: 'Pièces manquantes', active: !!sp.pieces },
            { href: toggle('retard'), label: 'En retard', active: !!sp.retard },
          ]}
        />
        {filtered && (
          <p className="text-sm">
            <Link href={href({ q: undefined, statut: undefined, type: undefined, mes: undefined, pieces: undefined, retard: undefined })} className="font-semibold text-accent hover:underline">
              Effacer les filtres
            </Link>
          </p>
        )}
        {!kanban && (
          <p className="text-xs text-ink-3">
            Tri :{' '}
            {sp.tri === 'recent' ? (
              <>
                les plus récentes d’abord.{' '}
                <Link href={href({ tri: undefined })} className="font-semibold text-primary underline">
                  Revenir au tri par priorité
                </Link>
              </>
            ) : (
              <>
                par priorité.{' '}
                <Link href={href({ tri: 'recent' })} className="font-semibold text-primary underline">
                  Voir les plus récentes d’abord
                </Link>
              </>
            )}
          </p>
        )}
      </div>

      {kanban ? (
        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
          <div className="grid min-w-275 grid-cols-5 gap-4">
            {columns.map(({ status, rows: list }) => (
              <section key={status.value} aria-labelledby={`col-${status.value}`} className="flex flex-col rounded-2xl bg-white/60 p-3 ring-1 ring-line">
                <h2 id={`col-${status.value}`} className="mb-3 flex items-center justify-between px-1 text-sm font-black text-primary">
                  {status.column}
                  <span className="rounded-full bg-soft px-2 text-xs text-ink-2">{counts[status.value]}</span>
                </h2>
                {list.length ? (
                  <ul className="space-y-2">
                    {list.map((r) => (
                      <KanbanCard key={r.id} r={r} advisors={advisors} />
                    ))}
                  </ul>
                ) : (
                  <p className="px-1 text-xs text-ink-3">Aucune demande.</p>
                )}
                {counts[status.value] > list.length && (
                  <Link href={href({ vue: undefined, statut: status.value })} className="mt-3 px-1 text-xs font-bold text-accent hover:underline">
                    Voir les {counts[status.value]} en liste
                  </Link>
                )}
              </section>
            ))}
          </div>
        </div>
      ) : rows.length ? (
        <>
          <ul className="space-y-2 md:space-y-0 md:divide-y md:divide-line md:overflow-hidden md:rounded-2xl md:border md:border-line md:bg-white md:shadow-sm">
            {rows.map((r) => (
              <RequestRow key={r.id} r={r} advisors={advisors} />
            ))}
          </ul>
          {pages > 1 && (
            <nav aria-label="Pagination" className="mt-5 flex items-center justify-between gap-3 text-sm">
              {page > 1 ? (
                <Link href={href({ page: String(page - 1) })} className={btn.ghost}>
                  <ChevronLeft className="size-4" aria-hidden /> Précédent
                </Link>
              ) : (
                <span />
              )}
              <span className="text-ink-2">
                Page {page} sur {pages}
              </span>
              {page < pages ? (
                <Link href={href({ page: String(page + 1) })} className={btn.ghost}>
                  Suivant <ChevronRight className="size-4" aria-hidden />
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </>
      ) : (
        <Card>
          <Empty
            icon={FolderOpen}
            title={filtered ? 'Aucune demande ne correspond.' : 'Aucune demande pour le moment.'}
            text={filtered ? 'Changez la recherche ou retirez un filtre.' : 'Les demandes envoyées depuis le site arriveront ici.'}
          />
        </Card>
      )}
    </>
  )
}
