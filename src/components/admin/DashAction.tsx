'use client'

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
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  return (
    <span className="la-action">
      <button
        type="button"
        className={tone === 'red' ? 'la-btn' : 'la-btn la-btn--ghost'}
        disabled={pending}
        aria-busy={pending}
        onClick={async () => {
          if (confirm && !window.confirm(confirm)) return
          setPending(true)
          setError('')
          const result = await RUN[kind](id).catch(() => ({ ok: false as const, error: 'Erreur réseau, réessayez.' }))
          setPending(false)
          if (!result.ok) {
            setError(result.error)
            return
          }
          router.refresh()
        }}
      >
        {pending ? 'En cours…' : label}
      </button>
      {error ? (
        <span className="la-err" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  )
}
