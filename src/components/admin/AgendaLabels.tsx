'use client'

import { useRowLabel } from '@payloadcms/ui'

const DAYS: Record<string, string> = { '1': 'Lundi', '2': 'Mardi', '3': 'Mercredi', '4': 'Jeudi', '5': 'Vendredi', '6': 'Samedi', '0': 'Dimanche' }

const strong = { fontWeight: 700, color: '#0d2449' } as const
const muted = { color: '#4a5468' } as const

/** « Lundi · 10:00 – 12:30 » au lieu de « Weekly 01 ». */
export function WeeklyRowLabel() {
  const { data, rowNumber } = useRowLabel<{ day?: string; from?: string; to?: string }>()
  return (
    <span>
      <span style={strong}>{data?.day ? DAYS[data.day] : `Plage ${(rowNumber ?? 0) + 1}`}</span>
      {data?.from && data?.to ? <span style={muted}> · {data.from} – {data.to}</span> : null}
    </span>
  )
}

const date = (v?: string) => (v ? new Date(v).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '…')

/** « 24 déc. 2026 → 2 janv. 2027 · Congés » au lieu de « Closures 01 ». */
export function ClosureRowLabel() {
  const { data, rowNumber } = useRowLabel<{ from?: string; to?: string; reason?: string }>()
  if (!data?.from) return <span style={strong}>Fermeture {(rowNumber ?? 0) + 1}</span>
  return (
    <span>
      <span style={strong}>
        {date(data.from)} → {date(data.to)}
      </span>
      {data.reason ? <span style={muted}> · {data.reason}</span> : null}
    </span>
  )
}
