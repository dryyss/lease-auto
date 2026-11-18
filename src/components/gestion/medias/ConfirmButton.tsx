'use client'

import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'

import { Dialog } from '@/components/gestion/Dialog'
import { ErrorText, safeRun } from '@/components/gestion/rendez-vous/dialog'
import { btn } from '@/components/gestion/ui'

type Result = { ok: true } | { ok: false; error: string }

/**
 * Bouton qui ouvre une fenêtre de confirmation, lance l'action puis rafraîchit la page.
 * Partagé par les écrans Images, Marques, Justificatifs, Abonnés et Newsletters.
 */
export function ConfirmButton({
  label,
  icon,
  title,
  children,
  cta,
  danger = true,
  run,
  className,
  disabled,
  disabledReason,
  onDone,
}: {
  label: ReactNode
  icon?: ReactNode
  title: string
  children: ReactNode
  cta: string
  danger?: boolean
  run: () => Promise<Result>
  className: string
  disabled?: boolean
  disabledReason?: string
  onDone?: () => void
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setPending(true)
    setError('')
    const r = await safeRun(run)
    setPending(false)
    if (!r.ok) return setError(r.error)
    setOpen(false)
    if (onDone) onDone()
    else router.refresh()
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
          setOpen(true)
        }}
      >
        {icon}
        {label}
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title={title}>
        <div className="space-y-2 text-sm text-ink-2">{children}</div>
        {error && <ErrorText>{error}</ErrorText>}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className={btn.ghost}
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Annuler
          </button>
          <button
            type="button"
            className={danger ? btn.danger : btn.primary}
            onClick={submit}
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? 'En cours…' : cta}
          </button>
        </div>
      </Dialog>
    </>
  )
}
