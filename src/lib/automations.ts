import type { Payload } from 'payload'

import { askForReview, remindAppointment, remindMissingDocuments, remindTeam } from './notifications'

const HOUR = 3_600_000
const DAY = 24 * HOUR
const iso = (ms: number) => new Date(ms).toISOString()

/** Minuit (heure de Paris) à la fin du lendemain. */
function endOfTomorrowParis(now: number) {
  const day = new Date(now).toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' }) // AAAA-MM-JJ
  const [y, m, d] = day.split('-').map(Number)
  // Minuit UTC du surlendemain, corrigé du décalage de Paris (1 h ou 2 h) : on prend la marge la plus large.
  return Date.UTC(y, m - 1, d + 2) - HOUR
}

/**
 * Automatisations du cahier des charges, lancées chaque matin par la tâche planifiée Vercel (vercel.json)
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
          { createdAt: { greater_than: iso(now - 30 * DAY) } },
        ],
      },
      limit: 100,
      depth: 0,
    })
    let sent = 0
    for (const r of docs) {
      if ((r.remindersSent ?? 0) !== attempt - 1) continue
      // Le client a déjà déposé des pièces (formulaire ou « Mon espace ») : c'est à l'équipe de les vérifier
      // (tableau de bord, « pièces à vérifier »). Lui écrire « il manque des pièces » serait faux.
      const received = await payload.count({ collection: 'documents', where: { request: { equals: r.id } } })
      if (received.totalDocs) continue
      if (!(await remindMissingDocuments(payload, r, attempt))) continue
      await payload.update({ collection: 'requests', id: r.id, data: { remindersSent: attempt }, context: ctx })
      sent++
    }
    report[`relance_dossier_${attempt}`] = sent
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

  // AUTO-03 : rappel la veille. La tâche tourne une fois par jour (le matin) : on prend tous les rendez-vous
  // jusqu'à la fin du lendemain, plus ceux du jour pris après le passage précédent (au moins 2 h avant).
  const soon = await payload.find({
    collection: 'appointments',
    where: {
      and: [{ status: { equals: 'confirmed' } }, { reminderSent: { equals: false } }, { startsAt: { greater_than: iso(now + 2 * HOUR) } }, { startsAt: { less_than: iso(endOfTomorrowParis(now)) } }],
    },
    limit: 100,
    depth: 0,
  })
  let reminded = 0
  for (const a of soon.docs) {
    // Pas d'e-mail parti (Resend pas branché, adresse refusée) : on ne le marque pas comme envoyé.
    if (!(await remindAppointment(payload, a))) continue
    await payload.update({ collection: 'appointments', id: a.id, data: { reminderSent: true }, context: ctx })
    reminded++
  }
  report.rappel_rendez_vous = reminded

  // AUTO-04 : demande d'avis quelques jours après la livraison.
  const reviewDays = settings.retention?.reviewRequestDays ?? 5
  const delivered = await payload.find({
    collection: 'requests',
    where: { and: [{ type: { equals: 'financing' } }, { status: { equals: 'delivered' } }, { deliveredAt: { less_than: iso(now - reviewDays * DAY) } }, { deliveredAt: { greater_than: iso(now - 30 * DAY) } }, { reviewRequestedAt: { exists: false } }] },
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
