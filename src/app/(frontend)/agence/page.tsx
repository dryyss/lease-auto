import { CalendarCheck, Clock, MapPin, Phone } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { ReviewsSection, StatsBand } from '@/components/home/Sections'
import { PageHero } from '@/components/ui/PageHero'
import { Prose } from '@/components/ui/Prose'
import { telHref } from '@/lib/format'
import { mediaSrc } from '@/lib/media'
import { getHomepage, getSettings, payloadClient } from '@/lib/payload'

export const metadata: Metadata = {
  title: 'L’agence Lease Auto à Épinay-sur-Seine',
  description: 'Découvrez l’agence Lease Auto, 42 boulevard Foch à Épinay-sur-Seine : horaires, plan d’accès et présentation de l’équipe.',
  alternates: { canonical: '/agence' },
}

export const revalidate = 3600

/** PUB-17 : présentation, photos de l'agence, plan d'accès, horaires. */
export default async function AgencyPage() {
  const payload = await payloadClient()
  const [agency, settings, home, reviews] = await Promise.all([
    payload.findGlobal({ slug: 'agency', depth: 1 }),
    getSettings(),
    getHomepage(),
    payload.find({ collection: 'reviews', where: { featured: { equals: true } }, limit: 3, sort: '-date', depth: 0 }),
  ])
  const c = settings.company
  const photos = (agency.photos ?? []).map((p) => ({ src: mediaSrc(p, 'card'), alt: typeof p === 'object' ? p.alt : '' })).filter((p) => p.src)

  return (
    <>
      <PageHero eyebrow="L’agence" title={agency.title ?? 'L’agence'} intro={agency.intro ?? undefined} crumbs={[{ label: 'L’agence' }]} />

      <section className="container-site grid gap-10 pb-16 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <Prose data={agency.content} className="[&>div>p:first-child]:mt-0" />
          {photos.length > 0 && (
            <div className="mt-8 grid grid-cols-2 gap-3">
              {photos.map((p, i) => (
                <div key={p.src} className={`relative overflow-hidden rounded-2xl bg-soft ${i === 0 ? 'col-span-2 aspect-video' : 'aspect-3/2'}`}>
                  <Image src={p.src!} alt={p.alt} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-28 lg:h-fit">
          <div className="card p-6">
            <h2 className="mb-4 text-lg font-black text-primary">Nous rendre visite</h2>
            <ul className="space-y-3 text-sm text-ink-2">
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                <span>
                  {c?.address}
                  <br />
                  {c?.postalCode} {c?.city}
                </span>
              </li>
              {c?.phone && (
                <li className="flex gap-2.5">
                  <Phone className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                  <a href={telHref(c.phone)} className="font-bold text-primary">{c.phone}</a>
                </li>
              )}
              {(settings.openingHours ?? []).map((h) => (
                <li key={h.id ?? h.days} className="flex gap-2.5">
                  <Clock className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden /> <span><strong className="text-primary">{h.days}</strong> : {h.hours}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 grid gap-2">
              <Link href="/rendez-vous" className="btn-primary w-full">
                <CalendarCheck className="size-4" aria-hidden /> Prendre rendez-vous
              </Link>
              {c?.mapsUrl && (
                <a href={c.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost w-full">Itinéraire</a>
              )}
            </div>
          </div>
          {agency.mapEmbedUrl?.startsWith('https://www.google.com/maps/embed') && (
            <iframe src={agency.mapEmbedUrl} title="Plan d’accès à l’agence Lease Auto" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="aspect-square w-full rounded-3xl border-0" />
          )}
        </aside>
      </section>

      <StatsBand stats={home.stats} />
      <ReviewsSection reviews={reviews.docs} googleUrl={c?.googleReviewUrl} />
    </>
  )
}
