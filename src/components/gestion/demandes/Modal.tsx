'use client'

import { Loader2, X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'

import { btn } from '@/components/gestion/ui'

/** Fenêtre modale native (<dialog>) : Échap et le bouton de fermeture la referment. */
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={titleId}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-line bg-white p-0 text-primary shadow-2xl backdrop:bg-primary/40 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
        <h2 id={titleId} className="text-lg font-black text-primary">
          {title}
        </h2>
        <button type="button" onClick={onClose} className="-mr-2 flex size-8 items-center justify-center rounded-lg text-ink-3 hover:bg-soft hover:text-primary" aria-label="Fermer">
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </dialog>
  )
}

/** Pied de fenêtre : erreur éventuelle, Annuler, bouton de validation. */
export function ModalFooter({ error, pending, onCancel, submitLabel, tone = 'primary', submitType = 'submit', onSubmit }: {
  error?: string
  pending: boolean
  onCancel: () => void
  submitLabel: string
  tone?: 'primary' | 'dark' | 'danger'
  submitType?: 'submit' | 'button'
  onSubmit?: () => void
}) {
  return (
    <>
      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-accent-soft px-3.5 py-2.5 text-sm font-semibold text-accent-dark">
          {error}
        </p>
      )}
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onCancel} className={btn.ghost} disabled={pending}>
          Annuler
        </button>
        <button type={submitType} onClick={onSubmit} className={btn[tone]} disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {pending ? 'En cours…' : submitLabel}
        </button>
      </div>
    </>
  )
}

/** Message d'erreur sous un bouton. */
export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null
  return (
    <p role="alert" className="text-sm font-semibold text-accent">
      {children}
    </p>
  )
}
