// Aperçu de ce que le site comprend des horaires saisis (statut « Ouvert » / « Fermé »).
import { parseOpeningHours } from '@/lib/opening-hours'

const NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const WEEK = [1, 2, 3, 4, 5, 6, 0]

/** « 09:30 » → « 9h30 », « 19:00 » → « 19h ». */
const h = (t: string) => {
  const [hh, mm] = t.split(':')
  return `${Number(hh)}h${mm === '00' ? '' : mm}`
}
const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1)

/** La ligne est-elle comprise ? Une ligne « Fermé » l'est dès que les jours sont reconnus. */
export function rowUnderstood(row: { days: string; hours: string }): boolean {
  if (!row.days.trim() || !row.hours.trim()) return false
  if (/ferm/i.test(row.hours)) return parseOpeningHours([{ days: row.days, hours: '9h-10h' }]) !== null
  return parseOpeningHours([row]) !== null
}

/**
 * Résumé lisible, jours consécutifs regroupés : « Lundi–vendredi 9h30–19h », « Dimanche fermé ».
 * null si une ligne n'est pas comprise (le site n'affiche alors aucun statut).
 */
export function hoursSummary(rows: { days: string; hours: string }[]): string[] | null {
  if (!rows.length || rows.some((r) => !rowUnderstood(r))) return null
  const ranges = parseOpeningHours(rows) ?? []
  const byDay = new Map<number, string>()
  for (const d of WEEK) {
    const times = ranges
      .filter((r) => Number(r.day) === d)
      .sort((a, b) => a.from.localeCompare(b.from))
      .map((r) => `${h(r.from)}–${h(r.to)}`)
    byDay.set(d, times.length ? times.join(' et ') : 'fermé')
  }
  const out: string[] = []
  let start = 0
  for (let i = 1; i <= WEEK.length; i++) {
    if (i < WEEK.length && byDay.get(WEEK[i]) === byDay.get(WEEK[start])) continue
    const first = NAMES[WEEK[start]]
    const last = NAMES[WEEK[i - 1]]
    out.push(`${cap(first)}${i - 1 > start ? `–${last}` : ''} ${byDay.get(WEEK[start])}`)
    start = i
  }
  return out
}
