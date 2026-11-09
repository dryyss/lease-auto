import { RichText } from '@payloadcms/richtext-lexical/react'
import { Bell, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
import type { Where } from 'payload'

import { AlertForm } from '@/components/forms/SimpleForms'
import { CreditNotice } from '@/components/ui/CreditNotice'
import { PageHero } from '@/components/ui/PageHero'
import { VehicleCard } from '@/components/vehicles/VehicleCard'
import { FUEL_LABELS, GEARBOX_LABELS } from '@/lib/format'
import { payloadClient, visibleVehiclesWhere } from '@/lib/payload'
import type { Brand, Model } from '@/payload-types'

export type CatalogParams = Record<string, string | string[] | undefined>

const PER_PAGE = 12
const SORTS = {
  recent: { label: 'Plus récents', sort: '-createdAt' },
  'prix-asc': { label: 'Prix croissant', sort: 'price' },
  'prix-desc': { label: 'Prix décroissant', sort: '-price' },
  'mensualite-asc': { label: 'Mensualité croissante', sort: 'monthlyFrom' },
  'km-asc': { label: 'Kilométrage croissant', sort: 'mileage' },
  'annee-desc': { label: 'Année la plus récente', sort: '-year' },
} as const

const BODY_LABELS: Record<string, string> = {
  citadine: 'Citadine',
  berline: 'Berline',
  break: 'Break',
  suv: 'SUV',
  monospace: 'Monospace',
  coupe: 'Coupé / cabriolet',
  utilitaire: 'Utilitaire',
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''
const n = (v: string) => (v && Number.isFinite(Number(v)) ? Number(v) : undefined)

/** Catalogue filtrable (PUB-04 / PUB-05), réutilisé par les pages marque et modèle (SEO-02). */
export async function Catalog({ params, brand, model }: { params: CatalogParams; brand?: Brand; model?: Model }) {
  const payload = await payloadClient()
  const base = await visibleVehiclesWhere()
  const f = {
    prixMax: one(params.prixMax),
    mensualiteMax: one(params.mensualiteMax),
    anneeMin: one(params.anneeMin),
    kmMax: one(params.kmMax),
    carburant: one(params.carburant),
    boite: one(params.boite),
    type: one(params.type),
    tri: (one(params.tri) || 'recent') as keyof typeof SORTS,
    page: Math.max(1, n(one(params.page)) ?? 1),
  }

  const and: Where[] = [...base.and]
  if (brand) and.push({ brand: { equals: brand.id } })
  if (model) and.push({ model: { equals: model.id } })
  if (n(f.prixMax)) and.push({ price: { less_than_equal: n(f.prixMax) } })
  if (n(f.mensualiteMax)) and.push({ monthlyFrom: { less_than_equal: n(f.mensualiteMax) } })
  if (n(f.anneeMin)) and.push({ year: { greater_than_equal: n(f.anneeMin) } })
  if (n(f.kmMax)) and.push({ mileage: { less_than_equal: n(f.kmMax) } })
  if (FUEL_LABELS[f.carburant]) and.push({ fuel: { equals: f.carburant } })
  if (GEARBOX_LABELS[f.boite]) and.push({ gearbox: { equals: f.boite } })
  if (BODY_LABELS[f.type]) and.push({ bodyType: { equals: f.type } })

  const [result, brands, models] = await Promise.all([
    payload.find({ collection: 'vehicles', where: { and }, sort: (SORTS[f.tri] ?? SORTS.recent).sort, limit: PER_PAGE, page: f.page, depth: 1 }),
    payload.find({ collection: 'brands', limit: 100, sort: 'name', depth: 0, select: { name: true, slug: true } }),
    brand
      ? payload.find({ collection: 'models', where: { brand: { equals: brand.id } }, limit: 100, sort: 'name', depth: 0, select: { name: true, slug: true } })
      : Promise.resolve(null),
  ])

  const path = `/vehicules${brand ? `/${brand.slug}` : ''}${model ? `/${model.slug}` : ''}`
  const pageHref = (page: number) => {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(f)) if (v && k !== 'page' && !(k === 'tri' && v === 'recent')) qs.set(k, String(v))
    if (page > 1) qs.set('page', String(page))
    const s = qs.toString()
    return `${path}${s ? `?${s}` : ''}`
  }
  const title = model ? `${brand?.name} ${model.name} d’occasion` : brand ? `${brand.name} d’occasion` : 'Nos véhicules d’occasion'
  const intro = model?.intro ?? brand?.intro

  const countLabel = !result.totalDocs
    ? 'De nouveaux véhicules arrivent chaque semaine : créez une alerte ci-dessous pour être prévenu en premier.'
    : `${result.totalDocs} véhicule${result.totalDocs > 1 ? 's' : ''} contrôlé${result.totalDocs > 1 ? 's' : ''}, garanti${result.totalDocs > 1 ? 's' : ''} et finançable${result.totalDocs > 1 ? 's' : ''} en LOA, LLD ou crédit.`

  return (
    <>
    <PageHero
      compact
      eyebrow="Stock"
      title={title}
      intro={countLabel}
      crumbs={[
        ...(brand ? [{ label: 'Véhicules', href: '/vehicules' as const }] : []),
        ...(model && brand ? [{ label: brand.name, href: `/vehicules/${brand.slug}` }] : []),
        { label: model?.name ?? brand?.name ?? 'Véhicules' },
      ]}
    />
    <div className="container-site pb-16">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Filtres : simple formulaire GET, fonctionne même sans JavaScript */}
        <div className="card h-fit p-5 lg:sticky lg:top-28">
          {/* Mobile : filtres repliables. Ordinateur : toujours visibles. */}
          <input type="checkbox" id="toggle-filters" className="peer sr-only" />
          <label htmlFor="toggle-filters" className="flex cursor-pointer items-center gap-2 font-black text-primary peer-focus-visible:ring-2 peer-focus-visible:ring-accent lg:cursor-default">
            <SlidersHorizontal className="size-4 text-accent" aria-hidden /> Filtrer et trier
          </label>
          <form action="/vehicules" className="mt-5 hidden space-y-4 text-sm peer-checked:block lg:block">
            <FilterSelect label="Marque" name="marque" value={brand?.slug ?? ''} options={[['', 'Toutes'], ...brands.docs.map((b) => [b.slug ?? '', b.name] as [string, string])]} />
            {models && models.docs.length > 0 && (
              <FilterSelect label="Modèle" name="modele" value={model?.slug ?? ''} options={[['', 'Tous'], ...models.docs.map((m) => [m.slug ?? '', m.name] as [string, string])]} />
            )}
            <FilterSelect label="Budget total" name="prixMax" value={f.prixMax} options={[['', 'Indifférent'], ...[10, 15, 20, 25, 30, 40, 50, 75].map((k) => [String(k * 1000), `Jusqu’à ${k} 000 €`] as [string, string])]} />
            <FilterSelect label="Mensualité" name="mensualiteMax" value={f.mensualiteMax} options={[['', 'Indifférent'], ...[200, 250, 300, 400, 500, 700, 1000].map((k) => [String(k), `Jusqu’à ${k} €/mois`] as [string, string])]} />
            <FilterSelect label="Année minimum" name="anneeMin" value={f.anneeMin} options={[['', 'Indifférent'], ...Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - i)).map((y) => [y, `${y} et plus`] as [string, string])]} />
            <FilterSelect label="Kilométrage" name="kmMax" value={f.kmMax} options={[['', 'Indifférent'], ...[20, 50, 80, 100, 150].map((k) => [String(k * 1000), `Moins de ${k} 000 km`] as [string, string])]} />
            <FilterSelect label="Carburant" name="carburant" value={f.carburant} options={[['', 'Tous'], ...Object.entries(FUEL_LABELS)]} />
            <FilterSelect label="Boîte" name="boite" value={f.boite} options={[['', 'Toutes'], ...Object.entries(GEARBOX_LABELS)]} />
            <FilterSelect label="Type" name="type" value={f.type} options={[['', 'Tous'], ...Object.entries(BODY_LABELS)]} />
            <FilterSelect label="Trier par" name="tri" value={f.tri} options={Object.entries(SORTS).map(([k, v]) => [k, v.label])} />
            <button type="submit" className="btn-primary w-full">Afficher les résultats</button>
            <Link href="/vehicules" className="block text-center text-xs font-bold text-ink-3 hover:text-accent">Réinitialiser</Link>
          </form>
        </div>

        <div>
          {result.docs.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {result.docs.map((v, i) => (
                <VehicleCard key={v.id} vehicle={v} priority={i < 3} />
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <p className="mb-2 text-lg font-black text-primary">Aucun véhicule ne correspond pour l’instant</p>
              <p className="text-sm text-ink-2">Élargissez vos critères, ou créez une alerte : vous serez prévenu dès qu’un véhicule arrive.</p>
            </div>
          )}

          {result.totalPages > 1 && (
            <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
              {result.hasPrevPage && (
                <Link href={pageHref(f.page - 1)} className="btn-ghost px-4!" aria-label="Page précédente">
                  <ChevronLeft className="size-4" />
                </Link>
              )}
              <span className="px-4 text-sm font-bold text-ink-2">
                Page {result.page} sur {result.totalPages}
              </span>
              {result.hasNextPage && (
                <Link href={pageHref(f.page + 1)} className="btn-ghost px-4!" aria-label="Page suivante">
                  <ChevronRight className="size-4" />
                </Link>
              )}
            </nav>
          )}

          <section className="card mt-12 p-6 sm:p-8">
            <h2 className="mb-1 flex items-center gap-2 text-xl font-black text-primary">
              <Bell className="size-5 text-accent" aria-hidden /> Vous ne trouvez pas votre bonheur ?
            </h2>
            <p className="mb-5 text-sm text-ink-2">Recevez un e-mail dès qu’un véhicule correspondant à vos critères arrive en stock.</p>
            <AlertForm brands={brands.docs.map((b) => ({ id: b.id, name: b.name }))} defaults={{ brand: brand?.id, maxPrice: f.prixMax, maxMonthly: f.mensualiteMax }} />
          </section>

          {intro && (
            <section className="mt-12 max-w-3xl text-sm leading-relaxed text-ink-2 [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-black [&_h2]:text-primary [&_p+p]:mt-3">
              <RichText data={intro} />
            </section>
          )}

          <CreditNotice className="mt-10 border-t border-line pt-6" />
        </div>
      </div>
    </div>
    </>
  )
}

function FilterSelect({ label, name, value, options }: { label: string; name: string; value: string; options: [string, string][] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-ink-2">{label}</span>
      <select name={name} defaultValue={value} className="input-field py-2.5!">
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  )
}
