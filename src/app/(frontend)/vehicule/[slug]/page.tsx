import { RichText } from '@payloadcms/richtext-lexical/react'
import { CalendarCheck, CarFront, Check, Phone, ShieldCheck, Truck } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { cache } from 'react'

import { CreditNotice } from '@/components/ui/CreditNotice'
import { breadcrumbJsonLd } from '@/components/ui/PageHero'
import { FavoriteButton, ShareButtons } from '@/components/vehicles/Favorites'
import { Gallery } from '@/components/vehicles/Gallery'
import { VehicleCard } from '@/components/vehicles/VehicleCard'
import { seoMeta } from '@/lib/catalog-lookup'
import { FORMULA_LABELS, FUEL_LABELS, GEARBOX_LABELS, formatEUR, formatKm, telHref } from '@/lib/format'
import { mediaSrc } from '@/lib/media'
import { getSettings, payloadClient, visibleVehiclesWhere } from '@/lib/payload'
import { redirectOrNotFound } from '@/lib/redirects'
import type { Brand, Media, Model } from '@/payload-types'

type Props = { params: Promise<{ slug: string }> }

export const revalidate = 300

const getVehicle = cache(async (slug: string) => {
  const payload = await payloadClient()
  const where = await visibleVehiclesWhere()
  const { docs } = await payload.find({ collection: 'vehicles', where: { and: [...where.and, { slug: { equals: slug } }] }, limit: 1, depth: 2 })
  return docs[0] ?? null
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const v = await getVehicle((await params).slug)
  if (!v) return {}
  const photo = v.gallery?.find((m): m is Media => typeof m === 'object')
  const base = seoMeta(v, {
    title: `${v.title} d’occasion, ${v.year}, ${formatKm(v.mileage)}`,
    description: `${v.title} ${v.year}, ${formatKm(v.mileage)}, ${FUEL_LABELS[v.fuel]?.toLowerCase()}, ${formatEUR(v.price)}${v.monthlyFrom ? ` ou dès ${formatEUR(v.monthlyFrom)}/mois` : ''}. Garantie ${v.warrantyMonths ?? 12} mois, livraison partout en France.`,
  })
  return {
    ...base,
    alternates: { canonical: `/vehicule/${v.slug}` },
    openGraph: { images: base.openGraph?.images ?? [mediaSrc(photo, 'large') ?? ''] },
  }
}

export default async function VehiclePage({ params }: Props) {
  const { slug } = await params
  const v = await getVehicle(slug)
  if (!v) return redirectOrNotFound(`/vehicule/${slug}`)

  const settings = await getSettings()
  const payload = await payloadClient()
  const brand = v.brand as Brand
  const model = v.model as Model
  const where = await visibleVehiclesWhere()
  const similar = await payload.find({
    collection: 'vehicles',
    where: { and: [...where.and, { id: { not_equals: v.id } }, { status: { not_equals: 'sold' } }, { or: [{ brand: { equals: brand.id } }, { bodyType: { equals: v.bodyType } }] }] },
    limit: 3,
    depth: 1,
  })

  const images = (v.gallery ?? [])
    .filter((m): m is Media => typeof m === 'object')
    .map((m) => ({ src: mediaSrc(m, 'large') ?? '', large: mediaSrc(m) ?? '', alt: m.alt || v.title }))
  const url = `${process.env.NEXT_PUBLIC_SERVER_URL ?? ''}/vehicule/${v.slug}`
  const monthlies = (v.monthlies ?? []).filter((m) => m.amount && settings.financing?.[m.formula]?.enabled)
  const unavailable = v.status !== 'available'
  const phone = settings.company?.phone

  const specs: [string, string | number | null | undefined][] = [
    ['Année', v.year],
    ['Mise en circulation', v.firstRegistration ? new Date(v.firstRegistration).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : null],
    ['Kilométrage', formatKm(v.mileage)],
    ['Carburant', FUEL_LABELS[v.fuel]],
    ['Boîte', GEARBOX_LABELS[v.gearbox]],
    ['Puissance', v.powerHp ? `${v.powerHp} ch` : null],
    ['Puissance fiscale', v.fiscalHp ? `${v.fiscalHp} CV` : null],
    ['Portes / places', v.doors || v.seats ? `${v.doors ?? '–'} / ${v.seats ?? '–'}` : null],
    ['Couleur', v.color],
    ['CO₂', v.co2 ? `${v.co2} g/km` : null],
    ['Crit’Air', v.critAir],
    ['Référence', v.reference],
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Car',
    name: v.title,
    brand: { '@type': 'Brand', name: brand.name },
    model: model.name,
    vehicleModelDate: String(v.year),
    mileageFromOdometer: { '@type': 'QuantitativeValue', value: v.mileage, unitCode: 'KMT' },
    fuelType: FUEL_LABELS[v.fuel],
    vehicleTransmission: GEARBOX_LABELS[v.gearbox],
    itemCondition: 'https://schema.org/UsedCondition',
    image: images.map((i) => `${process.env.NEXT_PUBLIC_SERVER_URL ?? ''}${i.src}`),
    offers: {
      '@type': 'Offer',
      price: v.price,
      priceCurrency: 'EUR',
      availability: v.status === 'available' ? 'https://schema.org/InStock' : v.status === 'reserved' ? 'https://schema.org/LimitedAvailability' : 'https://schema.org/SoldOut',
      url,
      seller: { '@type': 'AutoDealer', name: settings.company?.name ?? 'Lease Auto' },
    },
  }

  return (
    <div className="container-site pt-28 pb-16 sm:pt-32">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <nav aria-label="Fil d’Ariane" className="mb-3 text-xs text-ink-3">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: breadcrumbJsonLd([
              { label: 'Véhicules', href: '/vehicules' },
              { label: brand.name, href: `/vehicules/${brand.slug}` },
              { label: model.name, href: `/vehicules/${brand.slug}/${model.slug}` },
              { label: v.title },
            ]),
          }}
        />
        <Link href="/vehicules" className="inline-block py-1.5 hover:text-primary">Véhicules</Link> /{' '}
        <Link href={`/vehicules/${brand.slug}`} className="inline-block py-1.5 hover:text-primary">{brand.name}</Link> /{' '}
        <Link href={`/vehicules/${brand.slug}/${model.slug}`} className="inline-block py-1.5 hover:text-primary">{model.name}</Link>
      </nav>

      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
        <div className="contents lg:col-start-1 lg:row-start-1 lg:block lg:min-w-0">
          <div className="order-1 lg:order-none">
            <Gallery images={images} sold={v.status === 'sold'} />
          </div>

          <div className="order-3 space-y-10 lg:order-none lg:mt-10">
          <section>
            <h2 className="mb-4 text-xl font-black text-primary">Caractéristiques</h2>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
              {specs
                .filter(([, value]) => value !== null && value !== undefined && value !== '')
                .map(([label, value]) => (
                  <div key={label} className="bg-white p-4">
                    <dt className="text-[11px] font-semibold text-ink-3 uppercase">{label}</dt>
                    <dd className="mt-0.5 font-bold text-primary">{value}</dd>
                  </div>
                ))}
            </dl>
          </section>

          {v.equipment && v.equipment.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-black text-primary">Équipements</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {v.equipment.map((e) => (
                  <li key={e.id ?? e.label} className="flex items-center gap-2 text-sm text-ink-2">
                    <Check className="size-4 shrink-0 text-accent" aria-hidden /> {e.label}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {v.description && (
            <section className="text-sm leading-relaxed text-ink-2 [&_p+p]:mt-3">
              <h2 className="mb-4 text-xl font-black text-primary">Description</h2>
              <RichText data={v.description} />
            </section>
          )}

          <section className="grid gap-4 sm:grid-cols-3">
            {[
              [ShieldCheck, `Garantie ${v.warrantyMonths ?? 12} mois`, 'Pièces et main-d’œuvre'],
              [CarFront, 'Véhicule contrôlé', 'Expertise complète avant la vente'],
              [Truck, 'Livraison France', 'Ou retrait à Épinay-sur-Seine'],
            ].map(([Icon, title, text]) => {
              const I = Icon as typeof ShieldCheck
              return (
                <div key={title as string} className="card flex gap-3 p-4">
                  <I className="size-5 shrink-0 text-accent" aria-hidden />
                  <div>
                    <p className="text-sm font-bold text-primary">{title as string}</p>
                    <p className="text-xs text-ink-2">{text as string}</p>
                  </div>
                </div>
              )
            })}
          </section>
          </div>
        </div>

        <aside className="order-2 lg:sticky lg:top-28 lg:order-none lg:col-start-2 lg:row-start-1 lg:h-fit">
          <div className="card p-6 shadow-xl shadow-primary/5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h1 className="text-2xl leading-tight font-black text-primary">{v.title}</h1>
              <FavoriteButton id={v.id} />
            </div>
            {unavailable && (
              <p className={`mb-4 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase ${v.status === 'sold' ? 'bg-gray-900 text-white' : 'bg-amber-400 text-gray-900'}`}>
                {v.status === 'sold' ? 'Vendu' : 'Réservé'}
              </p>
            )}
            <p className="text-sm text-ink-2">
              {v.year} · {formatKm(v.mileage)} · {FUEL_LABELS[v.fuel]} · {GEARBOX_LABELS[v.gearbox]}
            </p>
            <p className="mt-4 text-[11px] font-semibold text-ink-3 uppercase">Prix TTC</p>
            <p className="text-3xl font-black tracking-tight text-primary sm:text-4xl">{formatEUR(v.price)}</p>

            {monthlies.length > 0 && (
              <div className="mt-5 space-y-2">
                {monthlies.map((m) => (
                  <Link
                    key={m.formula}
                    href={`/demande?vehicule=${v.id}&formule=${m.formula}&duree=${m.months ?? ''}&apport=${m.deposit ?? ''}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line p-3.5 transition hover:border-accent hover:bg-accent-soft"
                  >
                    <span>
                      <span className="block text-sm font-black text-primary">{FORMULA_LABELS[m.formula]}</span>
                      <span className="block text-[11px] text-ink-3">
                        {m.months} mois{m.deposit ? ` · apport ${formatEUR(m.deposit)}` : ''}
                      </span>
                    </span>
                    <span className="shrink-0 text-lg font-black text-accent">
                      {formatEUR(m.amount)}
                      <span className="text-xs">/mois*</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-6 grid gap-2.5">
              {v.status !== 'sold' && (
                <Link href={`/demande?vehicule=${v.id}`} className="btn-primary w-full">
                  Demander ce financement
                </Link>
              )}
              {v.status === 'available' && (
                <Link href={`/rendez-vous?vehicule=${v.id}`} className="btn-ghost w-full">
                  <CalendarCheck className="size-4" aria-hidden /> Réserver un essai
                </Link>
              )}
              {v.status === 'sold' && (
                <Link href={`/vehicules/${brand.slug}`} className="btn-primary w-full">
                  Voir les autres {brand.name}
                </Link>
              )}
              {phone && (
                <a href={telHref(phone)} className="btn-ghost w-full">
                  <Phone className="size-4" aria-hidden /> {phone}
                </a>
              )}
            </div>
            <div className="mt-5 border-t border-line pt-4">
              <ShareButtons title={v.title} url={url} />
            </div>
          </div>
          <CreditNotice className="mt-4 px-1" />
        </aside>
      </div>

      {similar.docs.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-black text-primary">Vous aimerez aussi</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.docs.map((s) => (
              <VehicleCard key={s.id} vehicle={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
