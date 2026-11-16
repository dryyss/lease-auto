'use client'

import { useRouteTransition } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { REFUSAL_REASONS } from '@/lib/refusal-reasons'

import { advanceRequest, cancelAppointment, markAppointmentDone, refuseRequest } from './actions'

const RUN = {
  advance: (id: number) => advanceRequest(id),
  refuse: (id: number, reason?: string, note?: string) => refuseRequest(id, reason, note),
  done: (id: number) => markAppointmentDone(id),
  cancel: (id: number) => cancelAppointment(id),
}

export type Confirm = { title: string; text: string; cta: string; danger?: boolean }

/**
 * Bouton d'action du tableau de bord. Avec `confirm`, ouvre une fenêtre aux couleurs de l'admin
 * (au lieu de la boîte grise du navigateur). « Refuser » y demande en plus le motif, obligatoire.
 */
export function DashAction({
  id,
  kind,
  label,
  tone = 'red',
  confirm,
}: {
  id: number
  kind: keyof typeof RUN
  label: string
  tone?: 'red' | 'ghost'
  confirm?: Confirm
}) {
  const router = useRouter()
  const { startRouteTransition } = useRouteTransition()
  const dialog = useRef<HTMLDialogElement>(null)
  const [state, setState] = useState<'idle' | 'pending' | 'done'>('idle')
  const [error, setError] = useState('')
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const refuse = kind === 'refuse'

  const run = async () => {
    setState('pending')
    setError('')
    let result: { ok: true } | { ok: false; error: string }
    try {
      result = await RUN[kind](id, reason, note)
    } catch {
      result = { ok: false, error: 'Le serveur ne répond pas. Rechargez la page puis réessayez.' }
    }
    if (!result.ok) {
      setState('idle')
      setError(result.error)
      return
    }
    dialog.current?.close()
    // Confirmation visible, puis la ligne change de bloc au rafraîchissement (barre de chargement de l'admin).
    setState('done')
    startRouteTransition(() => router.refresh())
  }

  const open = () => {
    setError('')
    if (confirm) dialog.current?.showModal()
    else void run()
  }

  const button = (
    <button
      type="button"
      className={tone === 'red' ? 'la-btn' : 'la-btn la-btn--ghost'}
      disabled={state !== 'idle'}
      aria-busy={state === 'pending'}
      onClick={open}
    >
      {state === 'pending' && !confirm ? 'En cours…' : state === 'done' ? '✓ Fait' : label}
    </button>
  )

  return (
    <span className="la-action">
      {button}
      {error && !confirm ? (
        <span className="la-err" role="alert">
          {error}
        </span>
      ) : null}
      {confirm ? (
        <dialog ref={dialog} className="la-dialog" aria-labelledby={`la-dlg-${kind}-${id}`} onClose={() => setError('')}>
          <form
            method="dialog"
            onSubmit={(e) => {
              e.preventDefault()
              void run()
            }}
          >
            <h2 id={`la-dlg-${kind}-${id}`} className="la-dialog__title">
              {confirm.title}
            </h2>
            <p className="la-dialog__text">{confirm.text}</p>

            {refuse ? (
              <div className="la-dialog__fields">
                <label className="la-dialog__label" htmlFor={`la-reason-${id}`}>
                  Motif du refus <span aria-hidden>*</span>
                </label>
                <select id={`la-reason-${id}`} className="la-dialog__input" required value={reason} onChange={(e) => setReason(e.target.value)}>
                  <option value="" disabled>
                    Choisir un motif…
                  </option>
                  {REFUSAL_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <label className="la-dialog__label" htmlFor={`la-note-${id}`}>
                  Précision {reason === 'other' ? <span aria-hidden>*</span> : <span className="la-dialog__hint">(facultatif)</span>}
                </label>
                <textarea
                  id={`la-note-${id}`}
                  className="la-dialog__input"
                  rows={3}
                  required={reason === 'other'}
                  maxLength={1000}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ex. taux d’endettement à 42 %, proposer un apport plus élevé…"
                />
                <p className="la-dialog__hint">Usage interne : le motif n’est pas envoyé au client.</p>
              </div>
            ) : null}

            {error ? (
              <p className="la-dialog__error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="la-dialog__actions">
              <button type="button" className="la-btn la-btn--ghost" onClick={() => dialog.current?.close()} disabled={state === 'pending'}>
                Annuler
              </button>
              <button type="submit" className={confirm.danger ? 'la-btn la-btn--danger' : 'la-btn'} disabled={state === 'pending'}>
                {state === 'pending' ? 'En cours…' : confirm.cta}
              </button>
            </div>
          </form>
        </dialog>
      ) : null}
    </span>
  )
}
