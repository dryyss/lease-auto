'use client'

import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { deleteReview, setReviewFeatured } from '@/app/(gestion)/gestion/avis/actions'
import { ConfirmAction, safeRun } from '@/components/gestion/rendez-vous/dialog'
import { btn } from '@/components/gestion/ui'

/** Interrupteur « Mis en avant » : l'avis apparaît (ou non) sur le site. */
export function FeaturedSwitch({ id, featured, author }: { id: number; featured: boolean; author: string }) {
  const router = useRouter()
  const [on, setOn] = useState(featured)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const toggle = async () => {
    const next = !on
    setOn(next)
    setPending(true)
    setError('')
    const r = await safeRun(() => setReviewFeatured(id, next))
    setPending(false)
    if (!r.ok) {
      setOn(!next)
      return setError(r.error)
    }
    router.refresh()
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <span className="inline-flex items-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={`Mettre en avant l’avis de ${author}`}
          disabled={pending}
          onClick={toggle}
          className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-60 ${on ? 'bg-emerald-600' : 'bg-line'}`}
        >
          <span aria-hidden className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition ${on ? 'translate-x-5' : ''}`} />
        </button>
        <span className="text-xs font-bold text-ink-2" aria-hidden>
          {pending ? 'En cours…' : on ? 'Mis en avant' : 'Non affiché'}
        </span>
      </span>
      {error && (
        <span role="alert" className="text-xs font-semibold text-accent">
          {error}
        </span>
      )}
    </span>
  )
}

export function DeleteReview({ id, author }: { id: number; author: string }) {
  return (
    <ConfirmAction
      className={`${btn.danger} ${btn.small}`}
      icon={<Trash2 className="size-3.5" aria-hidden />}
      label="Supprimer"
      title="Supprimer cet avis ?"
      text={`L’avis de ${author} sera retiré du site et de la console. Cette action est définitive.`}
      cta="Supprimer l’avis"
      danger
      run={() => deleteReview(id)}
    />
  )
}
