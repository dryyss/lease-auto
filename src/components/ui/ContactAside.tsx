import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'

import { telHref, whatsappHref } from '@/lib/format'
import { getSettings } from '@/lib/payload'

/** Bloc coordonnées affiché à côté des formulaires. */
export async function ContactAside({ children }: { children?: React.ReactNode }) {
  const s = await getSettings()
  const c = s.company
  const wa = whatsappHref(c?.whatsapp)
  return (
    <aside className="space-y-4">
      {children}
      <div className="gradient-cta rounded-3xl p-6">
        <p className="relative mb-4 text-lg font-black">Une question ? Parlons-en</p>
        <ul className="relative space-y-3 text-sm text-white/80">
          {c?.phone && (
            <li>
              <a href={telHref(c.phone)} className="flex items-center gap-2.5 font-bold text-white hover:underline">
                <Phone className="size-4 text-accent-on-dark" aria-hidden /> {c.phone}
              </a>
            </li>
          )}
          {wa && (
            <li>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 hover:text-white">
                <MessageCircle className="size-4 text-accent-on-dark" aria-hidden /> WhatsApp
              </a>
            </li>
          )}
          {c?.email && (
            <li>
              <a href={`mailto:${c.email}`} className="flex items-center gap-2.5 hover:text-white">
                <Mail className="size-4 text-accent-on-dark" aria-hidden /> {c.email}
              </a>
            </li>
          )}
          {c?.address && (
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-accent-on-dark" aria-hidden />
              {c.address}, {c.postalCode} {c.city}
            </li>
          )}
          {(s.openingHours ?? []).map((h) => (
            <li key={h.id ?? h.days} className="flex gap-2.5">
              <Clock className="mt-0.5 size-4 shrink-0 text-accent-on-dark" aria-hidden />
              {h.days} : {h.hours}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
