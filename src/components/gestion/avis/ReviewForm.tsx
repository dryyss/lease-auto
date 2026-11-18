'use client'

import { Pencil, Plus, ShieldAlert, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useId, useRef, useState } from 'react'

import { saveReview } from '@/app/(gestion)/gestion/avis/actions'
import { ErrorText, Modal, safeRun } from '@/components/gestion/rendez-vous/dialog'
import { btn, field, label } from '@/components/gestion/ui'
import { NETWORKS, type Network } from '@/components/ui/SocialLogos'

export type ReviewData = { id: number; source: Network; firstName: string; rating: number | null; date: string; text: string; url: string; featured: boolean }

/** Ajout ou modification d'un avis, dans une fenêtre. */
export function ReviewForm({ review, today }: { review?: ReviewData; today: string }) {
  const router = useRouter()
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()
  const [source, setSource] = useState<Network>(review?.source ?? 'google')
  const [rating, setRating] = useState(review?.rating ?? 5)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [round, setRound] = useState(0)

  const open = () => {
    setSource(review?.source ?? 'google')
    setRating(review?.rating ?? 5)
    setError('')
    setRound((n) => n + 1)
    ref.current?.showModal()
  }

  const submit = async (data: FormData) => {
    setPending(true)
    setError('')
    const r = await safeRun(() => saveReview(review?.id ?? null, data))
    setPending(false)
    if (!r.ok) return setError(r.error)
    ref.current?.close()
    router.refresh()
  }

  return (
    <>
      {review ? (
        <button type="button" onClick={open} className={`${btn.ghost} ${btn.small}`}>
          <Pencil className="size-3.5" aria-hidden /> Modifier
        </button>
      ) : (
        <button type="button" onClick={open} className={btn.primary}>
          <Plus className="size-4" aria-hidden /> Ajouter un avis
        </button>
      )}
      <Modal
        dialogRef={ref}
        wide
        title={review ? 'Modifier l’avis' : 'Ajouter un avis'}
        description={
          <span className="flex items-start gap-1.5 font-semibold text-accent-dark">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> Uniquement de vrais avis : les avis inventés sont interdits. Recopiez l’avis tel qu’il a été publié.
          </span>
        }
      >
        {/* key : le formulaire repart des dernières valeurs enregistrées à chaque ouverture. */}
        <form
          key={`${review?.id ?? 'nouveau'}-${round}`}
          onSubmit={(e) => {
            e.preventDefault()
            void submit(new FormData(e.currentTarget))
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <fieldset className="sm:col-span-2">
            <legend className={label}>Réseau</legend>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(NETWORKS) as Network[]).map((n) => {
                const { name, Logo } = NETWORKS[n]
                return (
                  <label
                    key={n}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-bold transition has-focus-visible:ring-3 has-focus-visible:ring-accent/15 ${source === n ? 'border-primary bg-primary text-white' : 'border-line bg-white text-primary hover:border-ink-3'}`}
                  >
                    <input type="radio" name="source" value={n} checked={source === n} onChange={() => setSource(n)} className="sr-only" />
                    <Logo className="size-5" />
                    {name}
                  </label>
                )
              })}
            </div>
          </fieldset>

          <div>
            <label className={label} htmlFor={`${id}-name`}>
              Prénom ou pseudo
            </label>
            <input id={`${id}-name`} name="firstName" required maxLength={80} defaultValue={review?.firstName} className={field} placeholder="Ex. Karim B." />
          </div>
          <div>
            <label className={label} htmlFor={`${id}-date`}>
              Date de l’avis
            </label>
            <input id={`${id}-date`} name="date" type="date" required max={today} defaultValue={review?.date ?? today} className={field} />
          </div>

          {source === 'google' && (
            <fieldset className="sm:col-span-2">
              <legend className={label}>Note Google</legend>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n} className="cursor-pointer rounded-lg p-1 has-focus-visible:ring-3 has-focus-visible:ring-accent/30">
                    <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} className="sr-only" />
                    <Star className={`size-7 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-line'}`} aria-hidden />
                    <span className="sr-only">{n === 1 ? '1 étoile' : `${n} étoiles`}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div className="sm:col-span-2">
            <label className={label} htmlFor={`${id}-text`}>
              Texte de l’avis ou du commentaire
            </label>
            <textarea id={`${id}-text`} name="text" required rows={5} maxLength={3000} defaultValue={review?.text} className={field} />
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor={`${id}-url`}>
              Lien vers l’avis ou la publication (facultatif)
            </label>
            <input id={`${id}-url`} name="url" type="url" maxLength={500} defaultValue={review?.url} className={field} placeholder="https://" />
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-primary sm:col-span-2">
            <input type="checkbox" name="featured" defaultChecked={review?.featured ?? true} className="size-4 accent-accent" />
            Mettre en avant sur le site
          </label>

          <div className="sm:col-span-2">
            {error && <ErrorText>{error}</ErrorText>}
            <div className="mt-2 flex flex-wrap justify-end gap-2">
              <button type="button" className={btn.ghost} onClick={() => ref.current?.close()} disabled={pending}>
                Fermer
              </button>
              <button type="submit" className={btn.primary} disabled={pending} aria-busy={pending}>
                {pending ? 'En cours…' : review ? 'Enregistrer' : 'Ajouter l’avis'}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </>
  )
}
