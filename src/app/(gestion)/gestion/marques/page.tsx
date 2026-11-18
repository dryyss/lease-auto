import { Tags } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { AddBrand } from '@/components/gestion/marques/AddBrand'
import { BrandList, type BrandRow } from '@/components/gestion/marques/BrandList'
import { SearchBox } from '@/components/gestion/medias/Pager'
import { Card, Empty, PageHeader } from '@/components/gestion/ui'
import { plural } from '@/lib/gestion/labels'
import { isAdminUser, requireStaff } from '@/lib/gestion/session'
import { mediaSrc } from '@/lib/media'

export const metadata: Metadata = { title: 'Marques et modèles' }

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default async function MarquesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const q = ((await searchParams).q ?? '').trim().slice(0, 80)
  const { payload, user } = await requireStaff()
  const ctx = { user, overrideAccess: false as const, depth: 0, pagination: false as const }

  // Tout le catalogue en trois requêtes légères ; les véhicules dans leur dernière version (brouillons compris).
  const [brands, models, vehicles] = await Promise.all([
    payload.find({
      collection: 'brands',
      sort: 'name',
      select: { name: true, slug: true, logo: true },
      ...ctx,
    }),
    payload.find({
      collection: 'models',
      sort: 'name',
      select: { name: true, slug: true, brand: true },
      ...ctx,
    }),
    payload.find({
      collection: 'vehicles',
      draft: true,
      select: { brand: true, model: true },
      ...ctx,
    }),
  ])

  const idOf = (v: unknown) =>
    v && typeof v === 'object' ? (v as { id: number }).id : (v as number | null | undefined)
  const byBrand = new Map<number, number>()
  const byModel = new Map<number, number>()
  for (const v of vehicles.docs) {
    const b = idOf(v.brand)
    const m = idOf(v.model)
    if (b) byBrand.set(b, (byBrand.get(b) ?? 0) + 1)
    if (m) byModel.set(m, (byModel.get(m) ?? 0) + 1)
  }

  const logoIds = brands.docs.map((b) => idOf(b.logo)).filter((x): x is number => !!x)
  const logos = logoIds.length
    ? (
        await payload.find({
          collection: 'media',
          where: { id: { in: logoIds } },
          limit: logoIds.length,
          user,
          overrideAccess: false,
          depth: 0,
        })
      ).docs
    : []

  const nq = norm(q)
  const all: BrandRow[] = brands.docs.map((b) => {
    const logo = logos.find((l) => l.id === idOf(b.logo))
    return {
      id: b.id,
      name: b.name,
      slug: b.slug ?? '',
      logo: logo ? { src: mediaSrc(logo, 'thumb') ?? '', alt: logo.alt } : null,
      vehicles: byBrand.get(b.id) ?? 0,
      models: models.docs
        .filter((m) => idOf(m.brand) === b.id)
        .map((m) => ({
          id: m.id,
          name: m.name,
          slug: m.slug ?? '',
          vehicles: byModel.get(m.id) ?? 0,
        })),
    }
  })
  // Recherche : marque dont le nom correspond (tous ses modèles), ou modèles qui correspondent.
  const list = q
    ? all
        .map((b) =>
          norm(b.name).includes(nq)
            ? b
            : { ...b, models: b.models.filter((m) => norm(m.name).includes(nq)) },
        )
        .filter((b) => norm(b.name).includes(nq) || b.models.length)
    : all

  return (
    <>
      <PageHeader
        title="Marques et modèles"
        subtitle={`${plural(brands.docs.length, 'marque')} et ${plural(models.docs.length, 'modèle')}. Chaque marque et chaque modèle a sa page sur le site.`}
        actions={<AddBrand />}
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <SearchBox
          action="/gestion/marques"
          id="marques-q"
          q={q}
          placeholder="Rechercher une marque ou un modèle"
        />
        {q && (
          <Link
            href="/gestion/marques"
            className="text-sm font-semibold text-accent hover:underline"
          >
            Effacer la recherche
          </Link>
        )}
      </div>

      {list.length ? (
        <BrandList brands={list} admin={isAdminUser(user)} expanded={!!q} />
      ) : (
        <Card>
          <Empty
            icon={Tags}
            title={
              q
                ? `Aucune marque ni aucun modèle ne correspond à « ${q} ».`
                : 'Aucune marque pour le moment.'
            }
            text="Les marques et modèles se créent ici ou directement depuis la fiche d’un véhicule."
          />
        </Card>
      )}
    </>
  )
}
