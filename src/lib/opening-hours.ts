// Transforme les horaires saisis en texte dans Réglages (« Lundi – vendredi » / « 9h30 – 19h ») en plages exploitables,
// pour le statut « Ouvert actuellement ». Une ligne non comprise est ignorée : mieux vaut aucun statut qu'un statut faux.

const DAYS = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'] // index = getDay()

export type OpeningRange = { day: string; from: string; to: string }

const strip = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')

function parseDays(text: string): number[] {
  const t = strip(text)
  const found = [...t.matchAll(/\b(dim|lun|mar|mer|jeu|ven|sam)[a-z]*\.?/g)].map((m) =>
    DAYS.indexOf(m[1]),
  )
  if (!found.length) return []
  // « lundi – vendredi », « lun-ven », « du lundi au vendredi » : plage. Sinon, liste (« samedi et dimanche »).
  if (found.length === 2 && /[–—-]|\bau\b/.test(t)) {
    const [a, b] = found
    const days: number[] = []
    for (let d = a; ; d = (d + 1) % 7) {
      days.push(d)
      if (d === b || days.length > 7) break
    }
    return days
  }
  return found
}

const hhmm = (h: string, m?: string) => `${h.padStart(2, '0')}:${(m || '00').padStart(2, '0')}`

function parseTimes(text: string): { from: string; to: string }[] {
  if (/ferm/i.test(text)) return []
  return [
    ...text.matchAll(/(\d{1,2})\s*[h:]\s*(\d{2})?\s*(?:[–—-]|à)\s*(\d{1,2})\s*[h:]\s*(\d{2})?/gi),
  ].map((m) => ({
    from: hhmm(m[1], m[2]),
    to: hhmm(m[3], m[4]),
  }))
}

/** null si une ligne n'est pas comprise : le statut n'est alors pas affiché. */
export function parseOpeningHours(rows: { days: string; hours: string }[]): OpeningRange[] | null {
  const ranges: OpeningRange[] = []
  for (const row of rows) {
    const days = parseDays(row.days)
    const times = parseTimes(row.hours)
    if (!days.length || (!times.length && !/ferm/i.test(row.hours))) return null
    for (const d of days) for (const t of times) ranges.push({ day: String(d), ...t })
  }
  return ranges.length ? ranges : null
}
