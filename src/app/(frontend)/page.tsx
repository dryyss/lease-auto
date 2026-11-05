import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import { FaqSection, FormulasSection, HomeHero, ReviewsSection, SectionHeader, StatsBand, StepsSection } from '@/components/home/Sections'
import { QuickSimulator } from '@/components/home/QuickSimulator'
import { CreditNotice } from '@/components/ui/CreditNotice'
import { VehicleCard } from '@/components/vehicles/VehicleCard'
import { mediaSrc } from '@/lib/media'
import { getHomepage, getSettings, payloadClient, visibleVehiclesWhere } from '@/lib/payload'
import { getFormulaRates } from '@/lib/rates'
import type { Faq, Media } from '@/payload-types'

// Le stock change souvent : page régénérée au plus toutes les 5 minutes.
export const revalidate = 300

export default async function HomePage() {
  const payload = await payloadClient()
  const [home, settings, where] = await Promise.all([getHomepage(), getSettings(), visibleVehiclesWhere()])

  const [stage, featured, reviews, faqsFallback] = await Promise.all([
    payload.find({
      collection: 'vehicles',
      where: { and: [...where.and, { status: { not_equals: 'sold' } }, { monthlyFrom: { greater_than: 0 } }] },
      limit: 5,
      sort: 'monthlyFrom',
      depth: 1,
    }),
    payload.find({
      collection: 'vehicles',
      where: { and: [...where.and, { featured: { equals: true } }, { status: { not_equals: 'sold' } }] },
      limit: 6,
      sort: '-updatedAt',
      depth: 1,
    }),
    payload.find({ collection: 'reviews', where: { featured: { equals: true } }, limit: 6, sort: '-date', depth: 0 }),
    payload.find({ collection: 'faqs', limit: 6, sort: 'order', depth: 0 }),
  ])

  const featuredFaqs = (home.featuredFaqs ?? []).filter((f): f is Faq => typeof f === 'object')
  const faqs = featuredFaqs.length ? featuredFaqs : faqsFallback.docs

  const rates = await getFormulaRates()

  const c = settings.company
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'AutoDealer',
      name: c?.name ?? 'Lease Auto',
      url: process.env.NEXT_PUBLIC_SERVER_URL,
      telephone: c?.phone,
      email: c?.email,
      address: { '@type': 'PostalAddress', streetAddress: c?.address, postalCode: c?.postalCode, addressLocality: c?.city, addressCountry: 'FR' },
      ...(reviews.docs.length && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: (reviews.docs.reduce((s, r) => s + r.rating, 0) / reviews.docs.length).toFixed(1),
          reviewCount: reviews.docs.length,
        },
      }),
    },
    faqs.length && {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: convertLexicalToPlaintext({ data: f.answer }) },
      })),
    },
  ].filter(Boolean)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      <HomeHero
        hero={home.hero}
        cars={stage.docs
          .flatMap((v) => {
            const photo = v.gallery?.find((m): m is Media => typeof m === 'object')
            if (!v.slug || !v.monthlyFrom) return []
            return [{ title: v.title, slug: v.slug, monthly: v.monthlyFrom, price: v.price, image: mediaSrc(photo, 'large') }]
          })
          .sort((a, b) => a.monthly - b.monthly)}
      />

      {featured.docs.length > 0 && (
        <section className="section relative overflow-hidden pt-0!">
          {/* eslint-disable-next-line @next/next/no-img-element -- Image décorative (watermark), pas de LCP */}
          <img
            src="/images/logo-lease-auto.png"
            alt=""
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 w-[80%] max-w-5xl -translate-x-1/2 -translate-y-1/2 opacity-[0.045]"
          />
          <div className="container-site relative">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <SectionHeader center={false} eyebrow="À la une" title="Nos véhicules du moment" />
              <Link href="/vehicules" className="btn-ghost mb-10 sm:mb-14">
                Tout le stock <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.docs.map((v, i) => (
                <VehicleCard key={v.id} vehicle={v} priority={i < 3} />
              ))}
            </div>
          </div>
        </section>
      )}

      <FormulasSection />

      {rates.length > 0 && (
        <section className="section">
          <div className="container-site max-w-6xl">
            <SectionHeader eyebrow="Simulateur" title={<>Estimez votre <span className="gradient-text">mensualité</span></>} />
            <QuickSimulator rates={rates} />
          </div>
        </section>
      )}

      <StatsBand stats={home.stats} />
      <StepsSection steps={home.steps} />
      <ReviewsSection reviews={reviews.docs} googleUrl={c?.googleReviewUrl} />
      <FaqSection faqs={faqs} />

      <div className="container-site pb-12">
        <CreditNotice className="border-t border-line pt-6" />
      </div>
    </>
  )
}
