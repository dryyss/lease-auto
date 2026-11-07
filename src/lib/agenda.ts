import type { Payload } from 'payload'

const TZ = 'Europe/Paris'

/** Décalage (ms) entre l'heure de Paris et UTC à un instant donné (gère l'heure d'été). */
function parisOffset(utcMs: number) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      .formatToParts(new Date(utcMs))
      .map((p) => [p.type, p.value]),
  )
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second)
  return asUtc - utcMs
}

/** Heure « murale » de Paris vers un instant UTC. */
export function parisTime(y: number, m: number, d: number, hh: number, mm: number) {
  const guess = Date.UTC(y, m - 1, d, hh, mm)
  const first = guess - parisOffset(guess)
  return first - (parisOffset(first) - parisOffset(guess))
}

/** Date et heure murales de Paris à un instant donné (par défaut maintenant). */
export function parisNow(utcMs = Date.now()) {
  const t = new Date(utcMs + parisOffset(utcMs))
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), hour: t.getUTCHours(), weekday: t.getUTCDay() }
}

export type DaySlots ={ date: string; label: string; times: { iso: string; label: string }[] }

/** PUB-14 : créneaux libres des prochains jours, d'après le global « Agenda » et les rendez-vous existants. */
export async function availableSlots(payload: Payload, days = 14): Promise<DaySlots[]> {
  const agenda = await payload.findGlobal({ slug: 'agenda', depth: 0 })
  const slotMs = (agenda.slotMinutes ?? 45) * 60_000
  const earliest = Date.now() + (agenda.minNoticeHours ?? 4) * 3_600_000
  const horizon = Date.now() + days * 86_400_000

  const booked = await payload.find({
    collection: 'appointments',
    where: { and: [{ status: { equals: 'confirmed' } }, { startsAt: { greater_than: new Date().toISOString() } }, { startsAt: { less_than: new Date(horizon).toISOString() } }] },
    limit: 500,
    depth: 0,
    select: { startsAt: true },
  })
  const taken = new Set(booked.docs.map((a) => new Date(a.startsAt).getTime()))
  const closures = (agenda.closures ?? []).map((c) => [new Date(c.from).setHours(0, 0, 0, 0), new Date(c.to).setHours(23, 59, 59, 999)])

  const result: DaySlots[] = []
  const dayFmt = new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' })
  const timeFmt = new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' })

  for (let i = 0; i <= days; i++) {
    const ref = new Date(Date.now() + i * 86_400_000)
    const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(ref).split('-').map(Number)
    const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
    const ranges = (agenda.weekly ?? []).filter((w) => Number(w.day) === weekday)
    const times: DaySlots['times'] = []
    for (const r of ranges) {
      const [fh, fm] = r.from.split(':').map(Number)
      const [th, tm] = r.to.split(':').map(Number)
      const end = parisTime(y, m, d, th, tm)
      for (let t = parisTime(y, m, d, fh, fm); t + slotMs <= end; t += slotMs) {
        if (t < earliest || taken.has(t) || closures.some(([a, b]) => t >= a && t <= b)) continue
        times.push({ iso: new Date(t).toISOString(), label: timeFmt.format(t) })
      }
    }
    if (times.length) result.push({ date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, label: dayFmt.format(ref), times })
  }
  return result
}

/** Vérifie côté serveur qu'un créneau demandé fait bien partie des créneaux libres. */
export async function isSlotAvailable(payload: Payload, iso: string) {
  const slots = await availableSlots(payload, 30)
  return slots.some((d) => d.times.some((t) => t.iso === iso))
}
