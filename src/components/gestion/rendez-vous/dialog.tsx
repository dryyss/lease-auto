'use client'

import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useId, useRef, useState, type ReactNode, type RefObject } from 'react'

import { btn } from '@/components/gestion/ui'

import type { Result } from './result'

// Fenêtres de la console : un vrai <dialog> (Échap pour fermer, focus gardé dedans), aux couleurs Lease Auto.

export function Modal({
  dialogRef,
  title,
  description,
  children,
  onClose,
  wide = false,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  onClose?: () => void
  wide?: boolean
}) {
  const id = useId()
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${id}-titre`}
      onClose={onClose}
      className={`m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] ${wide ? 'max-w-2xl' : 'max-w-md'} overflow-y-auto rounded-2xl border border-line bg-white p-0 text-left text-primary shadow-2xl backdrop:bg-primary/40 backdrop:backdrop-blur-sm`}
    >
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id={`${id}-titre`} className="text-lg font-black text-primary">
              {title}
            </h2>
            {description && <div className="mt-1 text-sm text-ink-2">{description}</div>}
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="-mt-1 -mr-1 flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-3 hover:bg-soft hover:text-primary"
            aria-label="Fermer"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}

export function ErrorText({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'warning' }) {
  return (
    <p
      role="alert"
      className={`mt-4 rounded-xl px-3.5 py-2.5 text-sm font-semibold ${tone === 'warning' ? 'border border-amber-300 bg-amber-50 text-amber-900' : 'bg-accent-soft text-accent-dark'}`}
    >
      {children}
    </p>
  )
}

/** Appel d'action serveur protégé : une coupure réseau devient un message lisible. */
export async function safeRun<R extends Result>(run: () => Promise<R>): Promise<R | { ok: false; error: string }> {
  try {
    return await run()
  } catch {
    return { ok: false, error: 'Le serveur ne répond pas. Rechargez la page puis réessayez.' }
  }
}

/** Bouton qui ouvre une fenêtre de confirmation, lance l'action puis rafraîchit la page. */
export function ConfirmAction({
  label,
  icon,
  title,
  text,
  cta,
  danger = false,
  run,
  className,
  disabled,
  disabledReason,
}: {
  label: ReactNode
  icon?: ReactNode
  title: string
  text: ReactNode
  cta: string
  danger?: boolean
  run: () => Promise<Result>
  className: string
  disabled?: boolean
  disabledReason?: string
}) {
  const router = useRouter()
  const ref = useRef<HTMLDialogElement>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setPending(true)
    setError('')
    const r = await safeRun(run)
    setPending(false)
    if (!r.ok) return setError(r.error)
    ref.current?.close()
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        className={className}
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
        onClick={() => {
          setError('')
          ref.current?.showModal()
        }}
      >
        {icon}
        {label}
      </button>
      <Modal dialogRef={ref} title={title} description={text}>
        {error && <ErrorText>{error}</ErrorText>}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" className={btn.ghost} onClick={() => ref.current?.close()} disabled={pending}>
            Retour
          </button>
          <button type="button" className={danger ? btn.danger : btn.primary} onClick={submit} disabled={pending} aria-busy={pending}>
            {pending ? 'En cours…' : cta}
          </button>
        </div>
      </Modal>
    </>
  )
}
