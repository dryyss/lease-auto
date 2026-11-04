'use client'

import { Check, Heart, Link2, Mail, MessageCircle } from 'lucide-react'
import { useEffect, useState, useSyncExternalStore } from 'react'

// PUB-08 : favoris et comparateur, gardés dans le navigateur du visiteur (pas de compte nécessaire).
const KEY = 'lease-auto:favoris'
const EVENT = 'lease-auto:favoris'
export const MAX_COMPARE = 3

const read = (): number[] => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(v) ? v.filter((n) => typeof n === 'number') : []
  } catch {
    return []
  }
}
let cache = '[]'
const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener(EVENT, cb)
    window.removeEventListener('storage', cb)
  }
}
const snapshot = () => {
  const next = JSON.stringify(read())
  if (next !== cache) cache = next
  return cache
}

export function useFavorites() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => '[]')
  const ids: number[] = JSON.parse(raw)
  const toggle = (id: number) => {
    const next = ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      /* navigation privée : favoris non conservés */
    }
    window.dispatchEvent(new Event(EVENT))
  }
  return { ids, toggle, has: (id: number) => ids.includes(id) }
}

export function FavoriteButton({ id, withLabel = false }: { id: number; withLabel?: boolean }) {
  const { has, toggle } = useFavorites()
  const active = has(id)
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        toggle(id)
      }}
      aria-pressed={active}
      aria-label={active ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      className={withLabel ? 'btn-ghost' : 'flex size-10 items-center justify-center rounded-full bg-white/90 shadow backdrop-blur'}
    >
      <Heart className={`size-4 ${active ? 'fill-accent text-accent' : 'text-primary'}`} aria-hidden />
      {withLabel && (active ? 'Dans mes favoris' : 'Ajouter aux favoris')}
    </button>
  )
}

export function FavoritesLink() {
  const { ids } = useFavorites()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return (
    <a href="/favoris" className="relative flex size-10 items-center justify-center rounded-xl text-gray-700 hover:bg-soft" aria-label={`Favoris et comparateur${mounted && ids.length ? ` (${ids.length})` : ''}`}>
      <Heart className="size-5" aria-hidden />
      {mounted && ids.length > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-accent text-[10px] font-black text-white">{ids.length}</span>
      )}
    </a>
  )
}

/** PUB-09 : partage par WhatsApp, e-mail ou lien. */
export function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false)
  const text = `${title} chez Lease Auto : ${url}`
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="font-bold text-ink-2">Partager :</span>
      <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" className="flex size-9 items-center justify-center rounded-full bg-soft text-[#1fa855] hover:bg-line" aria-label="Partager sur WhatsApp">
        <MessageCircle className="size-4" />
      </a>
      <a href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text)}`} className="flex size-9 items-center justify-center rounded-full bg-soft text-primary hover:bg-line" aria-label="Partager par e-mail">
        <Mail className="size-4" />
      </a>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          } catch {
            /* presse-papiers indisponible */
          }
        }}
        className="flex size-9 items-center justify-center rounded-full bg-soft text-primary hover:bg-line"
        aria-label="Copier le lien"
      >
        {copied ? <Check className="size-4 text-emerald-600" /> : <Link2 className="size-4" />}
      </button>
    </div>
  )
}
