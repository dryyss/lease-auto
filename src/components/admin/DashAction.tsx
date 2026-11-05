'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { advanceRequest, markAppointmentDone, refuseRequest } from './actions'

export function DashAction({
  id,
  kind,
  label,
  tone = 'red',
}: {
  id: number
  kind: 'advance' | 'refuse' | 'done'
  label: string
  tone?: 'red' | 'ghost'
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
      <button
        type="button"
        className={tone === 'red' ? 'la-btn' : 'la-btn-ghost'}
        disabled={pending}
        onClick={async () => {
          if (kind === 'refuse' && !window.confirm('Refuser cette demande ? Le client est prévenu par e-mail.')) return
          setPending(true)
          setError('')
          const run = kind === 'advance' ? advanceRequest : kind === 'refuse' ? refuseRequest : markAppointmentDone
          const result = await run(id)
          setPending(false)
          if (!result.ok) {
            setError(result.error)
            return
          }
          router.refresh()
        }}
      >
        {pending ? '…' : label}
      </button>
      {error ? <span className="la-err">{error}</span> : null}
    </span>
  )
}
