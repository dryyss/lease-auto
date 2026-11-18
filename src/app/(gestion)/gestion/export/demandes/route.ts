import type { Where } from 'payload'

import { lateBefore } from '@/components/gestion/demandes/format'
import { FORMULAS, PROFILES, REQUEST_TYPES, requestStatusLabel } from '@/lib/gestion/labels'
import { REFUSAL_REASONS } from '@/lib/refusal-reasons'
import type { Request as Demande } from '@/payload-types'

import { csvDate, csvResponse, findAll, staffFromRequest, unauthorized } from '../csv'

export const dynamic = 'force-dynamic'

const STATUSES: Demande['status'][] = ['new', 'review', 'approved', 'delivered', 'refused']

/**
 * Export CSV des demandes. Accepte les mêmes paramètres que la liste /gestion/demandes :
 * q, statut, type, mes, pieces, retard.
 */
export async function GET(req: Request) {
  const auth = await staffFromRequest(req)
  if (!auth) return unauthorized()
  const { payload, user } = auth
  const sp = new URL(req.url).searchParams
  const get = (k: string) => sp.get(k)?.trim() ?? ''

  // Mêmes filtres que la liste des demandes.
  const and: Where[] = []
  for (const word of get('q').split(/\s+/).filter(Boolean).slice(0, 5)) {
    and.push({
      or: (['firstName', 'lastName', 'email', 'phone', 'reference'] as const).map((f) => ({
        [f]: { contains: word },
      })),
    })
  }
  const statut = STATUSES.find((s) => s === get('statut'))
  if (statut) and.push({ status: { equals: statut } })
  const type = get('type')
  if (type in REQUEST_TYPES) and.push({ type: { equals: type } })
  if (get('mes')) and.push({ assignedTo: { equals: user.id } })
  if (get('pieces'))
    and.push(
      { type: { equals: 'financing' } },
      { missingDocuments: { equals: true } },
      { status: { in: ['new', 'review'] } },
    )
  if (get('retard'))
    and.push({ status: { equals: 'new' } }, { createdAt: { less_than: lateBefore() } })

  const rows = await findAll((page) =>
    payload.find({
      collection: 'requests',
      where: { and },
      sort: '-createdAt',
      limit: 500,
      page,
      depth: 1,
      populate: { vehicles: { title: true, reference: true }, users: { name: true, email: true } },
      select: { notes: false, history: false, documents: false },
      user,
      overrideAccess: false,
    }),
  )

  const reason = (v: string | null | undefined) =>
    REFUSAL_REASONS.find((r) => r.value === v)?.label ?? ''
  const rel = <T>(v: number | T | null | undefined) =>
    v && typeof v === 'object' ? (v as T) : null

  return csvResponse(
    'demandes',
    [
      'Référence',
      'Reçue le',
      'Type',
      'Statut',
      'Motif du refus',
      'Prénom',
      'Nom',
      'E-mail',
      'Téléphone',
      'Code postal',
      'Véhicule',
      'Réf. véhicule',
      'Formule',
      'Durée (mois)',
      'Apport (€)',
      'Profil',
      'Revenus mensuels (€)',
      'Budget mensuel (€)',
      'Pièces manquantes',
      'Reprise : véhicule',
      'Reprise : kilométrage',
      'Reprise : estimation (€)',
      'Conseiller',
      'Accepte les offres',
      'Origine',
      'Message',
      'Dernière action le',
      'Livrée le',
    ],
    rows.map((r) => {
      const v = rel<{ title?: string; reference?: string | null }>(r.vehicle)
      const advisor = rel<{ name?: string; email?: string }>(r.assignedTo)
      return [
        r.reference,
        csvDate(r.createdAt),
        REQUEST_TYPES[r.type],
        requestStatusLabel(r),
        r.status === 'refused'
          ? [reason(r.refusalReason), r.refusalNote].filter(Boolean).join(' : ')
          : '',
        r.firstName,
        r.lastName,
        r.email,
        r.phone,
        r.postalCode,
        v?.title,
        v?.reference,
        r.formula ? FORMULAS[r.formula] : '',
        r.months,
        r.deposit,
        r.profile ? PROFILES[r.profile] : '',
        r.monthlyIncome,
        r.monthlyBudget,
        r.type === 'financing' ? !!r.missingDocuments : '',
        r.type === 'tradein'
          ? [r.tradeIn?.brand, r.tradeIn?.model, r.tradeIn?.year].filter(Boolean).join(' ')
          : '',
        r.type === 'tradein' ? r.tradeIn?.mileage : null,
        r.type === 'tradein' ? r.tradeIn?.estimate : null,
        advisor?.name || advisor?.email,
        !!r.marketingConsent,
        r.source,
        r.message,
        csvDate(r.lastActionAt),
        csvDate(r.deliveredAt),
      ]
    }),
  )
}
