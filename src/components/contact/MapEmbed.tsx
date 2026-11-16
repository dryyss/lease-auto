'use client'

import { MapPin } from 'lucide-react'
import { useState } from 'react'

/** Carte Google chargée au clic : sans clic, aucun contenu ni cookie Google (consentement CNIL), et la page reste légère. */
export function MapEmbed({ src, address }: { src: string; address: string }) {
  const [loaded, setLoaded] = useState(false)
  if (loaded) {
    return (
      <iframe
        src={src}
        title={`Plan d’accès : ${address}`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-full w-full border-0"
      />
    )
  }
  return (
    <button
      type="button"
      onClick={() => setLoaded(true)}
      className="group relative flex h-full w-full flex-col items-center justify-center gap-3 overflow-hidden bg-soft text-center"
    >
      {/* Quadrillage façon plan, en CSS : rien n'est chargé chez Google avant le clic. */}
      <span
        aria-hidden
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'linear-gradient(rgba(13,36,73,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(13,36,73,.06) 1px, transparent 1px), linear-gradient(115deg, transparent 46%, rgba(13,36,73,.09) 46%, rgba(13,36,73,.09) 49%, transparent 49%)',
          backgroundSize: '28px 28px, 28px 28px, 100% 100%',
        }}
      />
      <span className="relative flex size-12 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/30 transition group-hover:scale-110">
        <MapPin className="size-6" aria-hidden />
      </span>
      <span className="relative text-sm font-bold text-primary">Afficher la carte</span>
      <span className="relative max-w-60 text-xs text-ink-3">
        La carte est fournie par Google, qui peut déposer des cookies.
      </span>
    </button>
  )
}
