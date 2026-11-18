'use client'

import { ImagePlus, Loader2, Search, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'

import { compressImage } from '@/components/forms/Form'
import { listMedia, uploadMedia, type MediaItem } from '@/lib/gestion/media-actions'

import { Dialog } from './Dialog'
import { btn, field } from './ui'

/**
 * Choix d'une image : depuis la médiathèque, ou envoi d'une nouvelle (compressée dans le navigateur).
 * `value` = image choisie (ou null). Le parent enregistre `value.id` dans le champ upload.
 */
export function ImagePicker({ value, onChange, label = 'Image', defaultAlt = '' }: { value: MediaItem | null; onChange: (m: MediaItem | null) => void; label?: string; defaultAlt?: string }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<MediaItem[]>([])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const input = useRef<HTMLInputElement>(null)

  const load = async (search = q) => {
    setBusy(true)
    const r = await listMedia(search)
    setBusy(false)
    if (r.ok) setItems(r.items)
    else setError(r.error)
  }

  const upload = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setError('')
    const form = new FormData()
    form.set('file', await compressImage(file))
    form.set('alt', defaultAlt)
    const r = await uploadMedia(form)
    setBusy(false)
    if (input.current) input.current.value = ''
    if (!r.ok) return setError(r.error)
    onChange(r.item)
    setOpen(false)
  }

  return (
    <div>
      <p className="mb-1.5 text-xs font-bold text-ink-2">{label}</p>
      <div className="flex flex-wrap items-center gap-3">
        {value ? (
          <span className="relative block h-24 w-36 overflow-hidden rounded-xl border border-line bg-soft">
            {/* eslint-disable-next-line @next/next/no-img-element -- vignette de la médiathèque, déjà redimensionnée */}
            <img src={value.thumb} alt={value.alt} className="h-full w-full object-cover" />
            <button type="button" onClick={() => onChange(null)} className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-white/90 text-ink-2 shadow hover:text-accent" aria-label="Retirer l’image">
              <X className="size-3.5" aria-hidden />
            </button>
          </span>
        ) : (
          <span className="flex h-24 w-36 items-center justify-center rounded-xl border border-dashed border-line bg-soft text-ink-3">
            <ImagePlus className="size-6" aria-hidden />
          </span>
        )}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className={`${btn.ghost} ${btn.small}`}
            onClick={() => {
              setOpen(true)
              void load('')
            }}
          >
            <Search className="size-3.5" aria-hidden /> Choisir dans la médiathèque
          </button>
          <label className={`${btn.ghost} ${btn.small} cursor-pointer`}>
            {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Upload className="size-3.5" aria-hidden />} Envoyer une image
            <input ref={input} type="file" accept="image/*" className="sr-only" onChange={(e) => void upload(e.target.files?.[0])} />
          </label>
        </div>
      </div>
      {error && (
        <p className="mt-2 text-sm font-semibold text-accent" role="alert">
          {error}
        </p>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title="Médiathèque" wide>
        {/* Pas de <form> ici : le sélecteur est souvent placé dans le formulaire de la page (formulaire imbriqué interdit). */}
        <div className="mb-4 flex gap-2" role="search">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void load()
              }
            }}
            placeholder="Rechercher une image"
            className={field}
            aria-label="Rechercher une image"
          />
          <button type="button" onClick={() => void load()} className={`${btn.dark} shrink-0`}>
            Rechercher
          </button>
        </div>
        {busy && items.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-ink-2">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Chargement…
          </p>
        ) : items.length === 0 ? (
          <p className="text-sm text-ink-2">Aucune image. Envoyez-en une avec le bouton « Envoyer une image ».</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {items.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(m)
                    setOpen(false)
                  }}
                  className={`block w-full overflow-hidden rounded-xl border-2 text-left transition hover:border-accent ${value?.id === m.id ? 'border-accent' : 'border-transparent'}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- vignette de la médiathèque */}
                  <img src={m.thumb} alt="" className="aspect-[3/2] w-full bg-soft object-cover" />
                  <span className="block truncate px-1.5 py-1 text-xs text-ink-2">{m.alt}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Dialog>
    </div>
  )
}
