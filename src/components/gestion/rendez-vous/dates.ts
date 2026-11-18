import { parisNow, parisTime } from '@/lib/agenda'

// Jours du calendrier, toujours à l'heure de Paris.

export type Day = { y: number; m: number; d: number }

const pad = (n: number) => String(n).padStart(2, '0')
export const dayKey = ({ y, m, d }: Day) => `${y}-${pad(m)}-${pad(d)}`

/** « 2026-11-18 » → jour, ou null si la date est invalide. */
export function parseDay(s: string | undefined): Day | null {
  const r = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? '')
  if (!r) return null
  const [y, m, d] = [Number(r[1]), Number(r[2]), Number(r[3])]
  const t = new Date(Date.UTC(y, m - 1, d))
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d ? { y, m, d } : null
}

export function addDays(day: Day, n: number): Day {
  const t = new Date(Date.UTC(day.y, day.m - 1, day.d + n))
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }
}

/** Lundi de la semaine du jour donné. */
export const mondayOf = (day: Day) => addDays(day, -((new Date(Date.UTC(day.y, day.m - 1, day.d)).getUTCDay() + 6) % 7))

export function todayParis(): Day {
  const n = parisNow()
  return { y: n.y, m: n.m, d: n.d }
}

/** Minuit (Paris) du jour, en millisecondes UTC. */
export const dayStart = (day: Day) => parisTime(day.y, day.m, day.d, 0, 0)

/** Jour (Paris) d'un instant ISO, au format AAAA-MM-JJ. */
export const parisDayKey = (iso: string) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso))

export const dayLabel = (day: Day, opts: Intl.DateTimeFormatOptions) => new Date(Date.UTC(day.y, day.m - 1, day.d, 12)).toLocaleDateString('fr-FR', { timeZone: 'UTC', ...opts })
