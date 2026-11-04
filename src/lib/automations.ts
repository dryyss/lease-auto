import type { Payload } from 'payload'

import { askForReview, remindAppointment, remindMissingDocuments, remindTeam } from './notifications'

const HOUR = 3_600_000
const DAY = 24 * HOUR
const iso = (ms: number) => new Date(ms).toISOString()

/**
 * Automatisations du cahier des charges, lancées toutes les heures par la tâche planifiée Vercel
 * (/api/cron) ou à la main avec `pnpm automations`. Chaque étape est idempotente : relancer
 * ne renvoie jamais deux fois le même e-mail.
 */
export async function runAutomations(payload: Payload) {
  const now = Date.now()
  const settings = await payload.findGlobal({ slug: 'settings', depth: 0 })
  const report: Record<string, number> = {}
  const ctx = { skipEmails: true }

  // AUTO-01 : justificatifs manquants, relance à 48 h puis à 5 jours.
  for (const [attempt, delay] of [
    [1, 2 * DAY],
    [2, 5 * DAY],
  ] as const) {
    const { docs } = await payload.find({
      collection: 'requests',
      where: {
        and: [
          { type: { equals: 'financing' } },
          { missingDocuments: { equals: true } },
          { status: { in: ['new', 'review'] } },
          { remindersSent: { less_than: attempt } },
          { createdAt: { less_than: iso(now - delay) } },
        ],
      },
      limit: 100,
      depth: 0,
    })
    for (const r of docs) {
      if ((r.remindersSent ?? 0) !== attempt - 1) continue
      await remindMissingDocuments(payload, r, attempt)
      await payload.update({ collection: 'requests', id: r.id, data: { remindersSent: attempt }, context: ctx })
    }
    report[`relance_dossier_${attempt}`] = docs.length
  }

  // AUTO-02 : demandes restées « nouvelles » au-delà du délai, rappel groupé une fois par demande.
  const staleHours = settings.retention?.internalReminderHours ?? 24
  const stale = await payload.find({
    collection: 'requests',
    where: { and: [{ status: { equals: 'new' } }, { createdAt: { less_than: iso(now - staleHours * HOUR) } }, { teamRemindedAt: { exists: false } }] },
    limit: 100,
    depth: 0,
  })
  await remindTeam(payload, stale.docs)
  for (const r of stale.docs) await payload.update({ collection: 'requests', id: r.id, data: { teamRemindedAt: iso(now) }, context: ctx })
  report.relance_interne = stale.docs.length

  // AUTO-03 : rappel la veille (rendez-vous dans les 24 prochaines heures, pas encore rappelés).
  const soon = await payload.find({
    collection: 'appointments',
    where: {
      and: [{ status: { equals: 'confirmed' } }, { reminderSent: { equals: false } }, { startsAt: { greater_than: iso(now + 2 * HOUR) } }, { startsAt: { less_than: iso(now + DAY) } }],
    },
    limit: 100,
    depth: 0,
  })
  for (const a of soon.docs) {
    await remindAppointment(payload, a)
    await payload.update({ collection: 'appointments', id: a.id, data: { reminderSent: true }, context: ctx })
  }
  report.rappel_rendez_vous = soon.docs.length

  // AUTO-04 : demande d'avis quelques jours après la livraison.
  const reviewDays = settings.retention?.reviewRequestDays ?? 5
  const delivered = await payload.find({
    collection: 'requests',
    where: { and: [{ status: { equals: 'delivered' } }, { deliveredAt: { less_than: iso(now - reviewDays * DAY) } }, { reviewRequestedAt: { exists: false } }] },
    limit: 100,
    depth: 0,
  })
  for (const r of delivered.docs) {
    if (await askForReview(payload, r)) {
      await payload.update({ collection: 'requests', id: r.id, data: { reviewRequestedAt: iso(now) }, context: ctx })
    }
  }
  report.demande_avis = delivered.docs.length

  // AUTO-06 : retrait des véhicules vendus après le délai (passés en brouillon, donc hors site et plan du site).
  const soldDays = settings.retention?.soldVisibleDays ?? 15
  const sold = await payload.find({
    collection: 'vehicles',
    where: { and: [{ status: { equals: 'sold' } }, { _status: { equals: 'published' } }, { soldAt: { less_than: iso(now - soldDays * DAY) } }] },
    limit: 100,
    depth: 0,
  })
  for (const v of sold.docs) {
    await payload.update({ collection: 'vehicles', id: v.id, data: { _status: 'draft' }, context: { skipAlerts: true } })
  }
  report.vendus_retires = sold.docs.length

  // ADM-05 / CONF-02 : suppression des justificatifs arrivés à échéance (fichier et fiche).
  const expired = await payload.delete({
    collection: 'documents',
    where: { deleteAfter: { less_than: iso(now) } },
    overrideAccess: true,
  })
  report.justificatifs_supprimes = expired.docs.length

  return report
}
