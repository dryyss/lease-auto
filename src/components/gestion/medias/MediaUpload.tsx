'use client'

import { CheckCircle2, CircleAlert, Clock, Loader2, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { compressImage } from '@/components/forms/Form'
import { Dialog } from '@/components/gestion/Dialog'
import { btn } from '@/components/gestion/ui'
import { uploadMedia } from '@/lib/gestion/media-actions'

// Limite des actions serveur : 5 Mo par requête (next.config). On garde une marge.
const MAX_BYTES = 4.5 * 1024 * 1024

type Line = { name: string; state: 'waiting' | 'sending' | 'done' | 'error'; error?: string }

/** Envoi de plusieurs images : compression dans le navigateur, une requête par image, avancement visible. */
export function MediaUpload() {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [lines, setLines] = useState<Line[]>([])
  const [open, setOpen] = useState(false)
  const [running, setRunning] = useState(false)

  const set = (i: number, patch: Partial<Line>) =>
    setLines((all) => all.map((l, j) => (j === i ? { ...l, ...patch } : l)))

  const start = async (list: FileList | null) => {
    const files = Array.from(list ?? [])
    if (input.current) input.current.value = ''
    if (!files.length) return
    setLines(files.map((f) => ({ name: f.name, state: 'waiting' })))
    setOpen(true)
    setRunning(true)
    for (const [i, original] of files.entries()) {
      set(i, { state: 'sending' })
      try {
        if (!original.type.startsWith('image/')) throw new Error('Ce fichier n’est pas une image.')
        const file = await compressImage(original)
        if (file.size > MAX_BYTES)
          throw new Error('Image trop lourde (4,5 Mo au maximum après compression).')
        const form = new FormData()
        form.set('file', file)
        const r = await uploadMedia(form)
        if (!r.ok) throw new Error(r.error)
        set(i, { state: 'done' })
      } catch (err) {
        set(i, {
          state: 'error',
          error:
            err instanceof Error && err.message
              ? err.message
              : 'Envoi impossible. Vérifiez la connexion.',
        })
      }
    }
    setRunning(false)
    router.refresh()
  }

  const done = lines.filter((l) => l.state === 'done').length
  const failed = lines.filter((l) => l.state === 'error').length
  const finished = done + failed

  return (
    <>
      <label
        className={`${btn.primary} cursor-pointer focus-within:ring-3 focus-within:ring-accent/30 ${running ? 'pointer-events-none opacity-60' : ''}`}
      >
        <Upload className="size-4" aria-hidden /> Envoyer des images
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          disabled={running}
          onChange={(e) => void start(e.target.files)}
        />
      </label>

      <Dialog open={open} onClose={() => setOpen(false)} title="Envoi des images">
        <p className="text-sm text-ink-2" aria-live="polite">
          {running
            ? `Envoi en cours : ${finished} sur ${lines.length}. Gardez cette page ouverte.`
            : `Terminé : ${done} image${done > 1 ? 's' : ''} ajoutée${done > 1 ? 's' : ''}${failed ? `, ${failed} en échec` : ''}.`}
        </p>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-soft"
          role="progressbar"
          aria-label="Avancement"
          aria-valuemin={0}
          aria-valuemax={lines.length}
          aria-valuenow={finished}
        >
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${lines.length ? (finished / lines.length) * 100 : 0}%` }}
          />
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {lines.map((l, i) => (
            <li key={`${l.name}-${i}`} className="flex items-start gap-2">
              {l.state === 'done' ? (
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0 text-emerald-600"
                  aria-label="Envoyée"
                />
              ) : l.state === 'error' ? (
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-accent" aria-label="Échec" />
              ) : l.state === 'sending' ? (
                <Loader2
                  className="mt-0.5 size-4 shrink-0 animate-spin text-primary"
                  aria-label="Envoi en cours"
                />
              ) : (
                <Clock className="mt-0.5 size-4 shrink-0 text-ink-3" aria-label="En attente" />
              )}
              <span className="min-w-0">
                <span className="block truncate font-semibold text-primary">{l.name}</span>
                {l.error && <span className="block text-xs text-accent">{l.error}</span>}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-ink-3">
          Le texte alternatif reprend le nom du fichier : modifiez-le ensuite en cliquant sur
          l’image.
        </p>
        <div className="mt-5 flex justify-end">
          <button type="button" className={btn.dark} onClick={() => setOpen(false)}>
            {running ? 'Masquer (l’envoi continue)' : 'Fermer'}
          </button>
        </div>
      </Dialog>
    </>
  )
}
