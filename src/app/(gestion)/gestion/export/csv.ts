import 'server-only'

import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

import type { Staff } from '@/lib/gestion/session'

// Exports tableur de la console : CSV UTF-8 avec BOM, séparateur « ; » (Excel en français l'ouvre directement).

/** Membre de l'équipe connecté, sinon null (la route répond 401). */
export async function staffFromRequest(
  req: Request,
): Promise<{ payload: Payload; user: Staff } | null> {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })
  if (
    user &&
    'role' in user &&
    (user.role === 'admin' || user.role === 'commercial') &&
    !user.disabled
  )
    return { payload, user: user as Staff }
  return null
}

export const unauthorized = () =>
  new Response('Connectez-vous à la console Gestion pour télécharger cet export.', {
    status: 401,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })

type Cell = string | number | boolean | null | undefined

function cell(v: Cell): string {
  if (v == null) return ''
  let s = typeof v === 'boolean' ? (v ? 'Oui' : 'Non') : String(v)
  // Protection contre l'injection de formules (=, @, +, - suivis d'autre chose qu'un nombre ou un téléphone).
  if (/^[=@\t\r]/.test(s) || /^[+-](?![\d\s.,]*$)/.test(s)) s = `'${s}`
  return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function csvResponse(name: string, header: string[], rows: Cell[][]) {
  const body = [header, ...rows].map((r) => r.map(cell).join(';')).join('\r\n')
  const day = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' })
  return new Response(`﻿${body}\r\n`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${name}-lease-auto-${day}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}

/** Date et heure de Paris, lisibles par Excel : 18/11/2026 14:05. */
export const csvDate = (s: string | null | undefined, withTime = true) =>
  s
    ? new Date(s).toLocaleString('fr-FR', {
        timeZone: 'Europe/Paris',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        ...(withTime && { hour: '2-digit', minute: '2-digit' }),
      })
    : ''

/** Parcourt toute une collection par pages de 500 (évite de tout charger d'un coup en base). */
export async function findAll<T>(
  load: (page: number) => Promise<{ docs: T[]; hasNextPage: boolean }>,
): Promise<T[]> {
  const out: T[] = []
  for (let page = 1; page <= 200; page++) {
    const r = await load(page)
    out.push(...r.docs)
    if (!r.hasNextPage) break
  }
  return out
}
