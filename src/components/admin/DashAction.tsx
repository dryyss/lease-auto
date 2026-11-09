'use client'

import { useRouteTransition } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { advanceRequest, cancelAppointment, markAppointmentDone, refuseRequest } from './actions'

const RUN = { advance: advanceRequest, refuse: refuseRequest, done: markAppointmentDone, cancel: cancelAppointment }

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
  confirm?: string
}) {
  const router = useRouter()
  const { startRouteTransition } = useRouteTransition()
  const [state, setState] = useState<'idle' | 'pending' | 'done'>('idle')
  const [error, setError] = useState('')

  return (
    <span className="la-action">
      <button
        type="button"
        className={tone === 'red' ? 'la-btn' : 'la-btn la-btn--ghost'}
        disabled={state !== 'idle'}
        aria-busy={state === 'pending'}
        onClick={async () => {
          if (confirm && !window.confirm(confirm)) return
          setState('pending')
          setError('')
          let result: Awaited<ReturnType<(typeof RUN)[typeof kind]>>
          try {
            result = await RUN[kind](id)
          } catch {
            result = { ok: false, error: 'Le serveur ne répond pas. Rechargez la page puis réessayez.' }
          }
          if (!result.ok) {
            setState('idle')
            setError(result.error)
            return
          }
          // Confirmation visible, puis la ligne change de bloc au rafraîchissement (barre de chargement de l'admin).
          setState('done')
          startRouteTransition(() => router.refresh())
        }}
      >
        {state === 'pending' ? 'En cours…' : state === 'done' ? '✓ Fait' : label}
      </button>
      {error ? (
        <span className="la-err" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  )
}
