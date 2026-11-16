'use client'

import { useEffect, useState } from 'react'

type Range = { day: string; from: string; to: string }
type Closure = { from: string; to: string }

const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + (m || 0)
}

/** Date (AAAA-MM-JJ), jour de la semaine et minute courante à Paris, quel que soit le fuseau du visiteur. */
function parisNow(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86_400_000)
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Paris',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  )
  const date = `${parts.year}-${parts.month}-${parts.day}`
  return {
    date,
    weekday: new Date(`${date}T12:00:00Z`).getUTCDay(),
    minute: Number(parts.hour) * 60 + Number(parts.minute),
  }
}

function status(weekly: Range[], closures: Closure[]) {
  const closed = (date: string) =>
    closures.some((c) => c.from.slice(0, 10) <= date && date <= c.to.slice(0, 10))
  const now = parisNow()
  const today = closed(now.date) ? [] : weekly.filter((r) => Number(r.day) === now.weekday)
  const current = today.find((r) => minutes(r.from) <= now.minute && now.minute < minutes(r.to))
  if (current) return { open: true, text: `Ouvert actuellement · ferme à ${current.to}` }

  // Prochaine ouverture : plus tard aujourd'hui, sinon les jours suivants.
  for (let i = 0; i <= 14; i++) {
    const day = parisNow(i)
    if (closed(day.date)) continue
    const next = weekly
      .filter((r) => Number(r.day) === day.weekday && (i > 0 || minutes(r.from) > now.minute))
      .sort((a, b) => minutes(a.from) - minutes(b.from))[0]
    if (next) {
      const when = i === 0 ? 'aujourd’hui' : i === 1 ? 'demain' : DAYS[day.weekday]
      return { open: false, text: `Fermé · ouvre ${when} à ${next.from}` }
    }
  }
  return { open: false, text: 'Fermé actuellement' }
}

/** « Ouvert actuellement » d'après les plages de l'agenda. Calculé dans le navigateur : la page peut être en cache. */
export function OpenStatus({ weekly, closures }: { weekly: Range[]; closures: Closure[] }) {
  const [state, setState] = useState<ReturnType<typeof status>>()
  useEffect(() => {
    const update = () => setState(status(weekly, closures))
    update()
    const timer = setInterval(update, 60_000)
    return () => clearInterval(timer)
  }, [weekly, closures])

  if (!weekly.length || !state) return null
  return (
    <p
      className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-bold ${
        state.open
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-line bg-soft text-ink-2'
      }`}
    >
      <span
        aria-hidden
        className={`size-2 rounded-full ${state.open ? 'animate-pulse bg-emerald-500' : 'bg-ink-3'}`}
      />
      {state.text}
    </p>
  )
}
