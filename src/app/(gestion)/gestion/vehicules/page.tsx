import { CarFront, ChevronLeft, ChevronRight, ImageOff, LayoutGrid, Plus, Search, Table2 } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { Badge, btn, Card, Empty, field, FilterPills, PageHeader } from '@/components/gestion/ui'
import { Plate } from '@/components/gestion/vehicules/Plate'
import { FUEL_LABEL } from '@/components/gestion/vehicules/shared'
import { ago, euro, km, plural, VEHICLE_STATUS, VEHICLE_STATUS_TONE } from '@/lib/gestion/labels'
import { requireStaff } from '@/lib/gestion/session'
import { mediaSrc } from '@/lib/media'
import type { Media } from '@/payload-types'

export const metadata: Metadata = { title: 'Véhicules' }

const PER_PAGE = 24

const FILTERS = [
  { key: '', label: 'Tous' },
  { key: 'disponibles', label: 'Disponibles' },
  { key: 'reserves', label: 'Réservés' },
  { key: 'vendus', label: 'Vendus' },
  { key: 'brouillons', label: 'Brouillons' },
  { key: 'a-completer', label: 'À compléter' },
] as const
type FilterKey = (typeof FILTERS)[number]['key']

type Row = {
  id: number
  title?: string | null
  plate?: string | null
  reference?: string | null
  price?: number | null
  monthlyFrom?: number | null
  status: 'available' | 'reserved' | 'sold'
  _status?: 'draft' | 'published' | null
  gallery?: (number | Media)[] | null
  mileage?: number | null
  year?: number | null
  fuel?: string | null
  updatedAt: string
}

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
const compact = (s: string) => norm(s).replace(/[\s-]+/g, '')
const incomplete = (v: Row) => !v.gallery?.length || !v.plate || v.price == null
const matches: Record<FilterKey, (v: Row) => boolean> = {
  '': () => true,
  disponibles: (v) => v.status === 'available',
  reserves: (v) => v.status === 'reserved',
  vendus: (v) => v.status === 'sold',
  brouillons: (v) => v._status !== 'published',
  'a-completer': incomplete,
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function VehiclesPage({ searchParams }: Props) {
  const sp = await searchParams
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) ?? ''
  const filtre = (FILTERS.find((f) => f.key === one('filtre'))?.key ?? '') as FilterKey
  const q = one('q').trim()
  const table = one('vue') === 'tableau'

  const { payload, user } = await requireStaff()
  // Tout le stock en une requête légère (dernière version, brouillons compris) : filtres, compteurs et recherche se font ici.
  const { docs } = await payload.find({
    collection: 'vehicles',
    draft: true,
    depth: 0,
    pagination: false,
    sort: '-updatedAt',
    select: { title: true, plate: true, reference: true, price: true, monthlyFrom: true, status: true, _status: true, gallery: true, mileage: true, year: true, fuel: true, updatedAt: true },
    user,
    overrideAccess: false,
  })
  const all = docs as unknown as Row[]

  const nq = norm(q)
  const cq = compact(q)
  const searched = q ? all.filter((v) => norm(v.title ?? '').includes(nq) || (cq && (compact(v.plate ?? '').includes(cq) || compact(v.reference ?? '').includes(cq)))) : all
  const list = searched.filter(matches[filtre])

  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE))
  const page = Math.min(pages, Math.max(1, Number.parseInt(one('page'), 10) || 1))
  const shown = list.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  // Photo principale des seules fiches affichées.
  const photoIds = shown.map((v) => v.gallery?.[0]).filter((g): g is number => typeof g === 'number')
  const photos = photoIds.length
    ? (await payload.find({ collection: 'media', where: { id: { in: photoIds } }, depth: 0, limit: photoIds.length, user, overrideAccess: false })).docs
    : []
  const photoOf = (v: Row) => {
    const first = v.gallery?.[0]
    const m = typeof first === 'object' ? first : photos.find((p) => p.id === first)
    return m ? { src: mediaSrc(m, table ? 'thumb' : 'card'), alt: m.alt } : null
  }

  const href = (o: { filtre?: string; q?: string; vue?: string; page?: number }) => {
    const p = new URLSearchParams()
    const f = o.filtre ?? filtre
    const s = o.q ?? q
    const vue = o.vue ?? (table ? 'tableau' : '')
    if (f) p.set('filtre', f)
    if (s) p.set('q', s)
    if (vue) p.set('vue', vue)
    if (o.page && o.page > 1) p.set('page', String(o.page))
    const str = p.toString()
    return `/gestion/vehicules${str ? `?${str}` : ''}`
  }

  return (
    <>
      <PageHeader
        title="Véhicules"
        subtitle={`${plural(all.length, 'véhicule')} en stock, dont ${all.filter((v) => v._status === 'published' && v.status !== 'sold').length} en ligne.`}
        actions={
          <Link href="/gestion/vehicules/nouveau" className={btn.primary}>
            <Plus className="size-4" aria-hidden /> Ajouter un véhicule
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterPills items={FILTERS.map((f) => ({ href: href({ filtre: f.key, page: 1 }), label: f.label, count: searched.filter(matches[f.key]).length, active: f.key === filtre }))} />
        <div className="flex flex-wrap items-center gap-2">
          <form action="/gestion/vehicules" className="relative min-w-0 flex-1 sm:w-72 sm:flex-none" role="search">
            {filtre && <input type="hidden" name="filtre" value={filtre} />}
            {table && <input type="hidden" name="vue" value="tableau" />}
            <label htmlFor="vehicules-q" className="sr-only">
              Rechercher un véhicule
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
            <input id="vehicules-q" name="q" type="search" defaultValue={q} placeholder="Titre, plaque, référence…" className={`${field} pl-10`} />
          </form>
          <nav aria-label="Affichage" className="flex rounded-xl border border-line bg-white p-1">
            <Link href={href({ vue: '', page })} aria-current={!table ? 'page' : undefined} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold ${!table ? 'bg-primary text-white' : 'text-ink-2 hover:text-primary'}`}>
              <LayoutGrid className="size-4" aria-hidden /> Cartes
            </Link>
            <Link href={href({ vue: 'tableau', page })} aria-current={table ? 'page' : undefined} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold ${table ? 'bg-primary text-white' : 'text-ink-2 hover:text-primary'}`}>
              <Table2 className="size-4" aria-hidden /> Tableau
            </Link>
          </nav>
        </div>
      </div>

      {list.length === 0 ? (
        <Card>
          <Empty
            icon={CarFront}
            title={q ? `Aucun véhicule ne correspond à « ${q} »` : 'Aucun véhicule ici'}
            text={filtre === 'a-completer' ? 'Toutes les fiches ont une photo, une plaque et un prix.' : 'Changez de filtre ou ajoutez un véhicule.'}
            action={
              <Link href="/gestion/vehicules/nouveau" className={btn.primary}>
                <Plus className="size-4" aria-hidden /> Ajouter un véhicule
              </Link>
            }
          />
        </Card>
      ) : table ? (
        <Card padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-line bg-soft text-xs font-bold text-ink-2">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    <span className="sr-only">Photo</span>
                  </th>
                  <th scope="col" className="px-4 py-3">Véhicule</th>
                  <th scope="col" className="px-4 py-3">Immatriculation</th>
                  <th scope="col" className="px-4 py-3 text-right">Prix</th>
                  <th scope="col" className="px-4 py-3 text-right">Km</th>
                  <th scope="col" className="px-4 py-3">Disponibilité</th>
                  <th scope="col" className="px-4 py-3">Annonce</th>
                  <th scope="col" className="px-4 py-3">Modifié</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {shown.map((v) => {
                  const photo = photoOf(v)
                  return (
                    <tr key={v.id} className="relative transition hover:bg-soft">
                      <td className="px-4 py-2.5">
                        <span className="block h-12 w-18 overflow-hidden rounded-lg bg-soft">
                          {/* eslint-disable-next-line @next/next/no-img-element -- miniature déjà optimisée par Payload */}
                          {photo?.src ? <img src={photo.src} alt="" className="size-full object-cover" loading="lazy" /> : <ImageOff className="m-auto mt-3.5 size-5 text-ink-3" aria-hidden />}
                        </span>
                      </td>
                      <td className="max-w-72 px-4 py-2.5">
                        <Link href={`/gestion/vehicules/${v.id}`} className="font-bold text-primary after:absolute after:inset-0 hover:text-accent focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-accent/40">
                          <span className="line-clamp-2">{v.title || 'Sans titre'}</span>
                        </Link>
                        <span className="block text-xs text-ink-3">
                          {[v.reference, v.year, v.fuel ? FUEL_LABEL[v.fuel] : null].filter(Boolean).join(' · ')}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <Plate value={v.plate} />
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <span className="font-bold text-primary">{euro(v.price)}</span>
                        {v.monthlyFrom ? <span className="block text-xs text-ink-3">dès {euro(v.monthlyFrom)}/mois</span> : null}
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap text-ink-2">{km(v.mileage)}</td>
                      <td className="px-4 py-2.5">
                        <Badge className={VEHICLE_STATUS_TONE[v.status]}>{VEHICLE_STATUS[v.status]}</Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <PublishBadge published={v._status === 'published'} />
                      </td>
                      <td className="px-4 py-2.5 text-xs whitespace-nowrap text-ink-3">{ago(v.updatedAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {shown.map((v) => {
            const photo = photoOf(v)
            return (
              <li key={v.id}>
                <Link
                  href={`/gestion/vehicules/${v.id}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-3 focus-visible:ring-accent/40 focus-visible:outline-none"
                >
                  <span className="relative block aspect-3/2 bg-soft">
                    {photo?.src ? (
                      // eslint-disable-next-line @next/next/no-img-element -- image déjà optimisée par Payload (webp)
                      <img src={photo.src} alt="" className="size-full object-cover" loading="lazy" />
                    ) : (
                      <span className="flex size-full flex-col items-center justify-center gap-1 text-sm font-semibold text-ink-3">
                        <ImageOff className="size-6" aria-hidden /> Sans photo
                      </span>
                    )}
                    <span className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                      <Badge className={VEHICLE_STATUS_TONE[v.status]}>{VEHICLE_STATUS[v.status]}</Badge>
                      <PublishBadge published={v._status === 'published'} />
                    </span>
                  </span>
                  <span className="flex flex-1 flex-col gap-2 p-4">
                    <span className="line-clamp-2 font-bold text-primary group-hover:text-accent">{v.title || 'Sans titre'}</span>
                    <span className="flex flex-wrap items-center gap-2">
                      <Plate value={v.plate} />
                      {v.reference && <span className="text-xs text-ink-3">Réf. {v.reference}</span>}
                    </span>
                    <span className="text-xs text-ink-2">{[km(v.mileage), v.year, v.fuel ? FUEL_LABEL[v.fuel] : null].filter((x) => x && x !== '—').join(' · ') || 'Caractéristiques à compléter'}</span>
                    <span className="mt-auto flex items-end justify-between gap-2 pt-1">
                      <span className="text-lg font-black text-accent">{v.price != null ? euro(v.price) : <span className="text-sm text-amber-700">Prix à indiquer</span>}</span>
                      {v.monthlyFrom ? <span className="text-xs font-semibold text-ink-2">dès {euro(v.monthlyFrom)}/mois</span> : null}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" className="mt-6 flex items-center justify-between gap-3">
          {page > 1 ? (
            <Link href={href({ page: page - 1 })} className={btn.ghost}>
              <ChevronLeft className="size-4" aria-hidden /> Précédent
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-ink-2">
            Page {page} sur {pages} · {plural(list.length, 'véhicule')}
          </span>
          {page < pages ? (
            <Link href={href({ page: page + 1 })} className={btn.ghost}>
              Suivant <ChevronRight className="size-4" aria-hidden />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  )
}

function PublishBadge({ published }: { published: boolean }) {
  return published ? <Badge className="bg-primary text-white">En ligne</Badge> : <Badge className="bg-white text-ink-2 ring-1 ring-line">Brouillon</Badge>
}
