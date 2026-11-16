import { Clock, ExternalLink, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'

import { GoogleLogo } from '@/components/ui/SocialLogos'
import { telHref, whatsappHref } from '@/lib/format'
import { parseOpeningHours } from '@/lib/opening-hours'
import { getSettings, payloadClient } from '@/lib/payload'

import { MapEmbed } from './MapEmbed'
import { OpenStatus } from './OpenStatus'

const CardTitle = ({ icon: Icon, children }: { icon: typeof Clock; children: React.ReactNode }) => (
  <p className="mb-5 flex items-center gap-3 text-lg font-black text-primary">
    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft">
      <Icon className="size-5 text-accent" aria-hidden />
    </span>
    {children}
  </p>
)

/** Téléphone et e-mail en un geste, plus le lien vers la fiche Google. */
export async function ContactDirectCard() {
  const s = await getSettings()
  const c = s.company
  const wa = whatsappHref(c?.whatsapp)
  const reviews = c?.mapsUrl || c?.googleReviewUrl
  return (
    <div className="card p-6">
      <p className="eyebrow mb-4">Contact direct</p>
      <div className="grid grid-cols-2 gap-3">
        {c?.phone && (
          <a href={telHref(c.phone)} className="btn-primary px-3!">
            <Phone className="size-4" aria-hidden /> Appeler
          </a>
        )}
        {c?.email && (
          <a href={`mailto:${c.email}`} className="btn-ghost px-3!">
            <Mail className="size-4" aria-hidden /> E-mail
          </a>
        )}
      </div>
      <dl className="mt-6 space-y-4">
        {c?.phone && (
          <div>
            <dt className="text-xs font-bold tracking-wide text-ink-3 uppercase">Téléphone</dt>
            <dd className="mt-1 text-2xl font-black text-primary">{c.phone}</dd>
          </div>
        )}
        {c?.email && (
          <div>
            <dt className="text-xs font-bold tracking-wide text-ink-3 uppercase">E-mail</dt>
            <dd className="mt-1 text-sm break-all text-primary">{c.email}</dd>
          </div>
        )}
      </dl>
      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:underline"
        >
          <MessageCircle className="size-4" aria-hidden /> Écrire sur WhatsApp
        </a>
      )}
      {reviews && (
        <a
          href={reviews}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 transition hover:border-amber-300"
        >
          <GoogleLogo className="size-5 shrink-0" />
          <span className="flex-1">Voir nos avis Google</span>
          <ExternalLink className="size-4 shrink-0" aria-hidden />
        </a>
      )}
    </div>
  )
}

/** Horaires affichés (Réglages) et statut en direct calculé sur ces mêmes horaires, fermetures exceptionnelles de l'Agenda comprises. */
export async function HoursCard() {
  const [s, agenda] = await Promise.all([
    getSettings(),
    (await payloadClient()).findGlobal({ slug: 'agenda', depth: 0 }),
  ])
  const hours = s.openingHours ?? []
  // Pas les plages de l'Agenda : ce sont les créneaux de rendez-vous, pas les heures d'ouverture.
  const weekly = parseOpeningHours(hours) ?? []
  const closures = (agenda.closures ?? []).map(({ from, to }) => ({ from, to }))
  return (
    <div className="card flex flex-col p-6 sm:p-8">
      <CardTitle icon={Clock}>Horaires d’ouverture</CardTitle>
      <dl className="flex-1 divide-y divide-line">
        {hours.map((h) => {
          const off = /ferm/i.test(h.hours)
          return (
            <div
              key={h.id ?? h.days}
              className="flex items-baseline justify-between gap-4 py-3.5 text-sm"
            >
              <dt className="font-bold text-primary">{h.days}</dt>
              <dd className={`text-right ${off ? 'text-ink-3' : 'text-ink-2'}`}>{h.hours}</dd>
            </div>
          )
        })}
      </dl>
      <div className="mt-5">
        <OpenStatus weekly={weekly} closures={closures} />
      </div>
    </div>
  )
}

/** Adresse, itinéraire et carte (chargée au clic). */
export async function AgencyMapCard() {
  const [s, agency] = await Promise.all([
    getSettings(),
    (await payloadClient()).findGlobal({ slug: 'agency', depth: 0 }),
  ])
  const c = s.company
  if (!c?.address) return null
  const address = `${c.address}, ${c.postalCode ?? ''} ${c.city ?? ''}`.trim()
  const mapsUrl =
    c.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  const embed =
    agency.mapEmbedUrl ||
    `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`
  return (
    <div className="card flex flex-col overflow-hidden">
      <div className="p-6 sm:p-8">
        <CardTitle icon={MapPin}>Notre agence</CardTitle>
        <p className="text-lg font-bold text-primary">{c.address}</p>
        <p className="text-ink-2">
          {c.postalCode} {c.city}
        </p>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:underline"
        >
          Itinéraire sur Google Maps <ExternalLink className="size-4" aria-hidden />
        </a>
      </div>
      <div className="grid min-h-64 flex-1 border-t border-line sm:min-h-80">
        <MapEmbed src={embed} address={address} />
      </div>
    </div>
  )
}
