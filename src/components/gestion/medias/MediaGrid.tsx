'use client'

import { ExternalLink, Loader2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { deleteMedia, getMediaUsage, type MediaUsage } from '@/app/(gestion)/gestion/medias/actions'
import { Dialog } from '@/components/gestion/Dialog'
import { ErrorText, safeRun } from '@/components/gestion/rendez-vous/dialog'
import { btn, field, label } from '@/components/gestion/ui'
import { fmtDate } from '@/lib/gestion/labels'
import { updateMediaAlt } from '@/lib/gestion/media-actions'

export type MediaCard = {
  id: number
  thumb: string
  large: string
  original: string
  alt: string
  filename: string
  width: number | null
  height: number | null
  filesize: number | null
  createdAt: string
}

const size = (n: number | null) =>
  n == null
    ? ''
    : n < 1024 * 1024
      ? `${Math.round(n / 1024)} Ko`
      : `${(n / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`

/** Grille de la médiathèque : un clic ouvre l'aperçu (texte alternatif, suppression). */
export function MediaGrid({ items }: { items: MediaCard[] }) {
  const [selected, setSelected] = useState<MediaCard | null>(null)
  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {items.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => setSelected(m)}
              className="group block w-full overflow-hidden rounded-2xl border border-line bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-3 focus-visible:ring-accent/40 focus-visible:outline-none"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- vignette déjà redimensionnée par Payload */}
              <img
                src={m.thumb}
                alt=""
                loading="lazy"
                className="aspect-3/2 w-full bg-soft object-cover"
              />
              <span className="block px-3 py-2">
                <span className="line-clamp-2 text-xs font-semibold text-primary group-hover:text-accent">
                  {m.alt || 'Sans description'}
                </span>
                <span className="mt-0.5 block text-[11px] text-ink-3">{fmtDate(m.createdAt)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <Dialog open={!!selected} onClose={() => setSelected(null)} title="Image" wide>
        {selected && (
          <MediaDetails key={selected.id} item={selected} onDeleted={() => setSelected(null)} />
        )}
      </Dialog>
    </>
  )
}

function MediaDetails({ item, onDeleted }: { item: MediaCard; onDeleted: () => void }) {
  const router = useRouter()
  const [alt, setAlt] = useState(item.alt)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [usage, setUsage] = useState<MediaUsage | null>(null)
  const [step, setStep] = useState<'idle' | 'checking' | 'confirm' | 'deleting'>('idle')

  const saveAlt = async () => {
    setSaving(true)
    setSaved(false)
    setError('')
    const r = await safeRun(() => updateMediaAlt(item.id, alt))
    setSaving(false)
    if (!r.ok) return setError(r.error)
    setSaved(true)
    router.refresh()
  }

  const askDelete = async () => {
    setStep('checking')
    setError('')
    const r = await safeRun(() => getMediaUsage(item.id))
    if (!r.ok) {
      setStep('idle')
      return setError(r.error)
    }
    setUsage(r.usage)
    setStep('confirm')
  }

  const confirmDelete = async () => {
    setStep('deleting')
    setError('')
    const r = await safeRun(() => deleteMedia(item.id))
    if (!r.ok) {
      setStep('confirm')
      return setError(r.error)
    }
    onDeleted()
    router.refresh()
  }

  const blocked = !!usage?.vehicles.length

  return (
    <div className="grid gap-5 md:grid-cols-[3fr_2fr]">
      <a
        href={item.original}
        target="_blank"
        rel="noopener noreferrer"
        className="block overflow-hidden rounded-xl bg-soft"
        title="Ouvrir l’image d’origine dans un nouvel onglet"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- aperçu de la médiathèque */}
        <img
          src={item.large || item.thumb}
          alt={item.alt}
          className="max-h-[60vh] w-full object-contain"
        />
      </a>

      <div className="space-y-4 text-sm">
        <dl className="space-y-1 text-ink-2">
          <div className="flex gap-2">
            <dt className="font-bold text-primary">Fichier :</dt>
            <dd className="min-w-0 truncate" title={item.filename}>
              {item.filename}
            </dd>
          </div>
          {item.width && item.height && (
            <div className="flex gap-2">
              <dt className="font-bold text-primary">Taille :</dt>
              <dd>
                {item.width} × {item.height} px{item.filesize ? `, ${size(item.filesize)}` : ''}
              </dd>
            </div>
          )}
          <div className="flex gap-2">
            <dt className="font-bold text-primary">Ajoutée le :</dt>
            <dd>{fmtDate(item.createdAt)}</dd>
          </div>
        </dl>
        <a
          href={item.original}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-accent"
        >
          Ouvrir l’image d’origine <ExternalLink className="size-3" aria-hidden />
          <span className="sr-only">(nouvel onglet)</span>
        </a>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void saveAlt()
          }}
        >
          <label htmlFor={`alt-${item.id}`} className={label}>
            Texte alternatif
          </label>
          <textarea
            id={`alt-${item.id}`}
            rows={3}
            maxLength={200}
            value={alt}
            onChange={(e) => {
              setAlt(e.target.value)
              setSaved(false)
            }}
            className={field}
            required
          />
          <p className="mt-1 text-xs text-ink-3">
            Décrivez l’image en une phrase. Google et les lecteurs d’écran s’en servent.
          </p>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="submit"
              className={`${btn.dark} ${btn.small}`}
              disabled={saving || !alt.trim() || alt === item.alt}
            >
              {saving ? 'Enregistrement…' : 'Enregistrer le texte'}
            </button>
            {saved && (
              <span role="status" className="text-xs font-semibold text-emerald-700">
                Enregistré.
              </span>
            )}
          </div>
        </form>

        <div className="border-t border-line pt-4">
          {step === 'idle' || step === 'checking' ? (
            <button
              type="button"
              className={`${btn.danger} ${btn.small}`}
              onClick={() => void askDelete()}
              disabled={step === 'checking'}
            >
              {step === 'checking' ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="size-3.5" aria-hidden />
              )}
              {step === 'checking' ? 'Vérification…' : 'Supprimer l’image'}
            </button>
          ) : blocked ? (
            <div
              role="alert"
              className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-900"
            >
              <p className="font-bold">
                Suppression impossible : cette image est utilisée par{' '}
                {usage!.vehicles.length > 1 ? 'ces véhicules' : 'ce véhicule'}.
              </p>
              <ul className="mt-1 list-disc pl-5">
                {usage!.vehicles.map((v) => (
                  <li key={v.id}>
                    <Link href={`/gestion/vehicules/${v.id}`} className="font-semibold underline">
                      {v.title}
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-1">Retirez-la d’abord de la fiche, puis revenez ici.</p>
            </div>
          ) : (
            <div
              role="alert"
              className="rounded-xl border border-accent/30 bg-accent-soft p-3 text-accent-dark"
            >
              <p className="font-bold">Supprimer définitivement cette image ?</p>
              {usage!.others.length ? (
                <>
                  <p className="mt-1">Elle est affichée ici, d’où elle disparaîtra :</p>
                  <ul className="mt-1 list-disc pl-5">
                    {usage!.others.map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="mt-1">
                  Aucun véhicule ni page ne l’utilise. Si elle a été insérée dans un texte, elle n’y
                  apparaîtra plus.
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`${btn.ghost} ${btn.small}`}
                  onClick={() => setStep('idle')}
                  disabled={step === 'deleting'}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className={`${btn.primary} ${btn.small}`}
                  onClick={() => void confirmDelete()}
                  disabled={step === 'deleting'}
                  aria-busy={step === 'deleting'}
                >
                  {step === 'deleting' ? 'Suppression…' : 'Supprimer définitivement'}
                </button>
              </div>
            </div>
          )}
          {error && <ErrorText>{error}</ErrorText>}
        </div>
      </div>
    </div>
  )
}
