'use client'

import { ArrowLeft, ArrowRight, GripVertical, ImagePlus, Loader2, Star, TriangleAlert, Upload, X } from 'lucide-react'
import { useEffect, useRef, useState, type DragEvent, type ReactNode } from 'react'

import { uploadPhoto } from '@/app/(gestion)/gestion/vehicules/actions'
import { compressImage } from '@/components/forms/Form'
import { btn } from '@/components/gestion/ui'

import type { Photo } from './shared'

const MAX_BYTES = 4.5 * 1024 * 1024

type Job = { key: string; name: string; state: 'attente' | 'envoi' | 'erreur'; error?: string }

/**
 * Photos du véhicule : dépôt (glisser-déposer ou bouton), envoi une par une (limite de 5 Mo par requête),
 * vignettes réordonnables. La première est la photo principale.
 */
export function PhotoManager({
  photos,
  onChange,
  title,
  error,
  onBusyChange,
}: {
  photos: Photo[]
  onChange: (next: Photo[] | ((prev: Photo[]) => Photo[])) => void
  title: string
  error?: string
  onBusyChange?: (busy: boolean) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])
  const [done, setDone] = useState(0)
  const [total, setTotal] = useState(0)
  const [busy, setBusy] = useState(false)
  const sending = useRef(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [announce, setAnnounce] = useState('')

  // Un fichier lâché à côté de la zone ne doit pas ouvrir l'image à la place de la page (saisie perdue).
  useEffect(() => {
    const block = (e: globalThis.DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) e.preventDefault()
    }
    window.addEventListener('dragover', block)
    window.addEventListener('drop', block)
    return () => {
      window.removeEventListener('dragover', block)
      window.removeEventListener('drop', block)
    }
  }, [])

  async function send(files: File[]) {
    const images = files.filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name))
    if (!images.length) return setAnnounce('Aucune image dans la sélection.')
    if (sending.current) return setAnnounce('Un envoi est déjà en cours : attendez qu’il se termine.')
    sending.current = true
    const batch = images.map((f, i) => ({ key: `${Date.now()}-${i}-${f.name}`, name: f.name, state: 'attente' as const }))
    setJobs((j) => [...j.filter((x) => x.state !== 'erreur'), ...batch])
    setDone(0)
    setTotal(images.length)
    setBusy(true)
    onBusyChange?.(true)
    let count = photos.length
    // Une requête par photo, dans l'ordre choisi.
    for (let i = 0; i < images.length; i++) {
      const job = batch[i]
      setJobs((j) => j.map((x) => (x.key === job.key ? { ...x, state: 'envoi' } : x)))
      const file = await compressImage(images[i])
      let result: Awaited<ReturnType<typeof uploadPhoto>>
      if (file.size > MAX_BYTES) {
        result = { ok: false, error: `« ${file.name} » est trop lourde, même réduite (4,5 Mo au maximum).` }
      } else {
        const form = new FormData()
        form.set('file', file)
        form.set('alt', `${title.trim() || 'Photo du véhicule'}, photo ${count + 1}`)
        result = await uploadPhoto(form).catch(() => ({ ok: false as const, error: `« ${file.name} » : connexion interrompue. Réessayez.` }))
      }
      if (result.ok) {
        count++
        const photo = { id: result.id, url: result.url, alt: result.alt }
        onChange((prev) => [...prev, photo])
        setJobs((j) => j.filter((x) => x.key !== job.key))
      } else {
        setJobs((j) => j.map((x) => (x.key === job.key ? { ...x, state: 'erreur', error: result.error } : x)))
      }
      setDone(i + 1)
    }
    sending.current = false
    setBusy(false)
    onBusyChange?.(false)
    setAnnounce(`${images.length} photo${images.length > 1 ? 's' : ''} traitée${images.length > 1 ? 's' : ''}.`)
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= photos.length || from === to) return
    const next = [...photos]
    const [p] = next.splice(from, 1)
    next.splice(to, 0, p)
    onChange(next)
    setAnnounce(`Photo déplacée en position ${to + 1} sur ${photos.length}.${to === 0 ? ' C’est la photo principale.' : ''}`)
  }

  function remove(i: number) {
    onChange(photos.filter((_, k) => k !== i))
    setAnnounce(`Photo ${i + 1} retirée.`)
  }

  const onDropFiles = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    if (dragIndex !== null) return
    void send(Array.from(e.dataTransfer.files))
  }

  return (
    // Tout le bloc accepte le dépôt de fichiers (zone, vignettes, messages).
    <div
      onDragOver={(e) => {
        if (dragIndex !== null) return
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false)
      }}
      onDrop={onDropFiles}
    >
      <div
        className={`flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition ${over ? 'border-accent bg-accent-soft' : error ? 'border-accent/60 bg-white' : 'border-line bg-soft'}`}
      >
        <ImagePlus className="size-8 text-ink-3" aria-hidden />
        <p className="text-sm text-ink-2">
          <strong className="text-primary">Glissez vos photos ici</strong> ou choisissez-les sur l’appareil. Elles sont réduites avant l’envoi.
        </p>
        <button type="button" id="f-gallery" onClick={() => input.current?.click()} className={btn.dark} disabled={busy} aria-describedby={error ? 'f-gallery-error' : undefined}>
          <Upload className="size-4" aria-hidden /> Choisir des photos
        </button>
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            void send(Array.from(e.target.files ?? []))
            e.target.value = ''
          }}
        />
      </div>
      {error && (
        <p id="f-gallery-error" className="mt-2 text-sm font-semibold text-accent">
          {error}
        </p>
      )}

      {(busy || jobs.length > 0) && (
        <div className="mt-4 space-y-2" aria-live="polite">
          {busy && (
            <div>
              <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-primary">
                <Loader2 className="size-4 animate-spin" aria-hidden /> Envoi des photos : {done} sur {total}
              </p>
              <span className="block h-2 overflow-hidden rounded-full bg-soft" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label="Progression de l’envoi">
                <span className="block h-full rounded-full bg-accent transition-all" style={{ width: `${(done / total) * 100}%` }} />
              </span>
            </div>
          )}
          <ul className="space-y-1 text-sm">
            {jobs.map((j) => (
              <li key={j.key} className={`flex items-center gap-2 ${j.state === 'erreur' ? 'text-accent' : 'text-ink-2'}`}>
                {j.state === 'erreur' ? <TriangleAlert className="size-4 shrink-0" aria-hidden /> : j.state === 'envoi' ? <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden /> : <span className="size-4 shrink-0" />}
                <span className="min-w-0 flex-1 truncate">{j.state === 'erreur' ? j.error : `${j.name}${j.state === 'attente' ? ' (en attente)' : ' (envoi…)'}`}</span>
                {j.state === 'erreur' && (
                  <button type="button" onClick={() => setJobs((x) => x.filter((y) => y.key !== j.key))} className="rounded-lg p-1 text-ink-3 hover:bg-soft hover:text-primary" aria-label="Fermer ce message">
                    <X className="size-4" aria-hidden />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {photos.length > 0 && (
        <>
          <p className="mt-5 mb-2 text-xs text-ink-3">Glissez une vignette pour changer l’ordre, ou utilisez les flèches. La première est la photo principale.</p>
          <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((p, i) => (
              <li
                key={p.id}
                draggable
                onDragStart={(e) => {
                  setDragIndex(i)
                  e.dataTransfer.effectAllowed = 'move'
                }}
                onDragEnd={() => setDragIndex(null)}
                onDragOver={(e) => {
                  if (dragIndex === null) return
                  e.preventDefault()
                }}
                onDrop={(e) => {
                  if (dragIndex === null) return // fichier déposé sur une vignette : géré par le bloc parent
                  e.preventDefault()
                  e.stopPropagation()
                  move(dragIndex, i)
                  setDragIndex(null)
                }}
                className={`group relative overflow-hidden rounded-xl border bg-white transition ${i === 0 ? 'border-accent ring-2 ring-accent/30' : 'border-line'} ${dragIndex === i ? 'opacity-40' : ''}`}
              >
                <span className="relative block aspect-3/2 cursor-grab bg-soft active:cursor-grabbing">
                  {/* eslint-disable-next-line @next/next/no-img-element -- miniature Payload */}
                  {p.url ? <img src={p.url} alt={p.alt} className="size-full object-cover" draggable={false} /> : <span className="flex size-full items-center justify-center text-xs text-ink-3">Aperçu indisponible</span>}
                  <GripVertical className="absolute top-2 right-2 size-5 rounded bg-white/85 p-0.5 text-ink-2" aria-hidden />
                  {i === 0 && (
                    <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-white">
                      <Star className="size-3" aria-hidden /> Photo principale
                    </span>
                  )}
                </span>
                <span className="flex items-center justify-between gap-1 p-1.5">
                  <span className="pl-1 text-xs font-bold text-ink-3">n° {i + 1}</span>
                  <span className="flex gap-1">
                    <IconButton label={`Déplacer la photo ${i + 1} vers la gauche`} disabled={i === 0} onClick={() => move(i, i - 1)}>
                      <ArrowLeft className="size-4" aria-hidden />
                    </IconButton>
                    <IconButton label={`Déplacer la photo ${i + 1} vers la droite`} disabled={i === photos.length - 1} onClick={() => move(i, i + 1)}>
                      <ArrowRight className="size-4" aria-hidden />
                    </IconButton>
                    <IconButton label={`Retirer la photo ${i + 1}`} danger onClick={() => remove(i)}>
                      <X className="size-4" aria-hidden />
                    </IconButton>
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  )
}

function IconButton({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex size-8 items-center justify-center rounded-lg border border-line transition focus-visible:ring-3 focus-visible:ring-accent/40 focus-visible:outline-none disabled:opacity-30 ${danger ? 'text-accent hover:bg-accent-soft' : 'text-primary hover:bg-soft'}`}
    >
      {children}
    </button>
  )
}
