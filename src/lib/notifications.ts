import type { Payload } from 'payload'

import type { Appointment, Media, Request, Subscriber, Vehicle } from '@/payload-types'

import { CREDIT_WARNING } from './credit-legal'
import { internalRecipients, renderEmail, sendEmail, siteUrl, type EmailBlock } from './email'
import { FORMULA_LABELS, formatEUR, formatKm } from './format'

const REQUEST_TYPES: Record<Request['type'], string> = {
  financing: 'Demande de financement',
  tradein: 'Estimation de reprise',
  contact: 'Message',
  callback: 'Demande de rappel',
}

const STATUS_TEXT: Record<Request['status'], { title: string; text: string }> = {
  new: { title: 'Votre demande est bien reçue', text: 'Un conseiller l’étudie et revient vers vous.' },
  review: { title: 'Votre dossier est à l’étude', text: 'Votre dossier est en cours d’étude par nos partenaires financiers. Nous vous tenons informé dès qu’une réponse arrive.' },
  approved: { title: 'Bonne nouvelle : accord obtenu', text: 'Votre financement a reçu un accord. Votre conseiller vous contacte pour organiser la signature et la livraison.' },
  refused: { title: 'Réponse à votre demande', text: 'Nous n’avons malheureusement pas pu obtenir d’accord pour ce dossier. Votre conseiller peut étudier avec vous une autre solution (autre véhicule, apport, durée).' },
  delivered: { title: 'Bonne route avec votre véhicule', text: 'Merci pour votre confiance. Toute l’équipe Lease Auto vous souhaite une excellente route.' },
}

const getSettings = (payload: Payload) => payload.findGlobal({ slug: 'settings', depth: 0 })

const vehicleOf = async (payload: Payload, v: Request['vehicle'] | Appointment['vehicle']) => {
  if (!v) return null
  if (typeof v === 'object') return v
  return payload.findByID({ collection: 'vehicles', id: v, depth: 0 }).catch(() => null)
}

const requestRows = async (payload: Payload, r: Request): Promise<EmailBlock> => {
  const vehicle = await vehicleOf(payload, r.vehicle)
  return {
    type: 'rows',
    rows: [
      ['Référence', r.reference],
      ['Type', REQUEST_TYPES[r.type]],
      ['Véhicule', vehicle ? `${vehicle.title} (${formatEUR(vehicle.price)})` : null],
      ['Formule', r.formula ? FORMULA_LABELS[r.formula] : null],
      ['Durée', r.months ? `${r.months} mois` : null],
      ['Apport', r.deposit != null ? formatEUR(r.deposit) : null],
      ['Reprise', r.tradeIn?.brand ? `${r.tradeIn.brand} ${r.tradeIn.model ?? ''} ${r.tradeIn.year ?? ''} · ${formatKm(r.tradeIn.mileage)}` : null],
    ],
  }
}

/** MAIL-01 + MAIL-03 : accusé de réception au client et notification immédiate à l'équipe. */
export async function notifyNewRequest(payload: Payload, r: Request, documentsCount = 0) {
  const settings = await getSettings(payload)
  const rows = await requestRows(payload, r)
  const missingDocs = r.type === 'financing' && r.missingDocuments

  await sendEmail(payload, {
    to: r.email,
    subject: `${REQUEST_TYPES[r.type]} bien reçue · ${r.reference}`,
    html: renderEmail({
      settings,
      title: `Merci ${r.firstName}, votre demande est bien reçue`,
      blocks: [
        { type: 'p', text: 'Voici le récapitulatif de votre demande. Un conseiller Lease Auto vous répond sous 48 h ouvrées.' },
        rows,
        ...(missingDocs
          ? [{ type: 'p' as const, text: 'Pour accélérer l’étude, pensez à nous transmettre vos justificatifs en répondant à cet e-mail ou depuis le lien ci-dessous.' }]
          : []),
        { type: 'button', label: 'Voir nos véhicules', href: `${siteUrl()}/vehicules` },
      ],
    }),
  })

  await sendEmail(payload, {
    to: internalRecipients(settings),
    replyTo: r.email,
    subject: `[Nouvelle ${REQUEST_TYPES[r.type].toLowerCase()}] ${r.firstName} ${r.lastName} · ${r.reference}`,
    html: renderEmail({
      settings,
      title: `${REQUEST_TYPES[r.type]} de ${r.firstName} ${r.lastName}`,
      blocks: [
        { type: 'rows', rows: [['Téléphone', r.phone], ['E-mail', r.email], ['Code postal', r.postalCode], ['Justificatifs joints', documentsCount]] },
        rows,
        ...(r.message ? [{ type: 'p' as const, text: `Message : ${r.message}` }] : []),
        { type: 'button', label: 'Ouvrir dans l’administration', href: `${siteUrl()}/admin/collections/requests/${r.id}` },
      ],
    }),
  })
}

/** MAIL-02 : e-mail au client à chaque changement de statut. */
export async function notifyStatusChange(payload: Payload, r: Request) {
  const settings = await getSettings(payload)
  const s = STATUS_TEXT[r.status]
  await sendEmail(payload, {
    to: r.email,
    subject: `${s.title} · ${r.reference}`,
    html: renderEmail({
      settings,
      title: s.title,
      blocks: [
        { type: 'p', text: `Bonjour ${r.firstName},` },
        { type: 'p', text: s.text },
        await requestRows(payload, r),
        { type: 'p', text: `Une question ? Appelez-nous au ${settings.company?.phone ?? ''} en indiquant la référence ${r.reference}.` },
      ],
    }),
  })
}

/** AUTO-01 : relance du client quand des justificatifs manquent. */
export async function remindMissingDocuments(payload: Payload, r: Request, attempt: number) {
  const settings = await getSettings(payload)
  return sendEmail(payload, {
    to: r.email,
    subject: `Il manque des pièces à votre dossier · ${r.reference}`,
    html: renderEmail({
      settings,
      title: attempt === 1 ? 'Votre dossier attend vos justificatifs' : 'Dernier rappel pour votre dossier',
      blocks: [
        { type: 'p', text: `Bonjour ${r.firstName},` },
        {
          type: 'p',
          text: 'Pour que nos partenaires puissent étudier votre financement, il nous manque encore des justificatifs : pièce d’identité, justificatif de domicile, 3 derniers bulletins de salaire, dernier avis d’imposition et RIB.',
        },
        { type: 'p', text: 'Répondez simplement à cet e-mail avec vos documents (PDF ou photos lisibles), ou envoyez-les sur WhatsApp.' },
      ],
    }),
    replyTo: settings.company?.email ?? undefined,
  })
}

/** AUTO-02 : rappel à l'équipe des demandes sans réponse. */
export async function remindTeam(payload: Payload, pending: Request[]) {
  if (!pending.length) return
  const settings = await getSettings(payload)
  await sendEmail(payload, {
    to: internalRecipients(settings),
    subject: `${pending.length} demande(s) sans réponse depuis plus de ${settings.retention?.internalReminderHours ?? 24} h`,
    html: renderEmail({
      settings,
      title: 'Demandes à traiter',
      blocks: [
        { type: 'rows', rows: pending.map((r) => [`${r.reference} · ${REQUEST_TYPES[r.type]}`, `${r.firstName} ${r.lastName} · ${r.phone}`]) },
        { type: 'button', label: 'Ouvrir les demandes', href: `${siteUrl()}/admin/collections/requests?where[status][equals]=new` },
      ],
    }),
  })
}

/** AUTO-04 : demande d'avis Google quelques jours après la livraison. */
export async function askForReview(payload: Payload, r: Request) {
  const settings = await getSettings(payload)
  const url = settings.company?.googleReviewUrl
  if (!url) return false
  return sendEmail(payload, {
    to: r.email,
    subject: 'Votre avis compte pour nous',
    html: renderEmail({
      settings,
      title: `${r.firstName}, comment se passent vos premiers kilomètres ?`,
      blocks: [
        { type: 'p', text: 'Votre avis aide d’autres conducteurs à nous faire confiance. Cela prend moins d’une minute.' },
        { type: 'button', label: 'Laisser un avis sur Google', href: url },
      ],
    }),
  })
}

const KIND_LABELS: Record<Appointment['kind'], string> = { 'test-drive': 'Essai', visit: 'Passage en agence', delivery: 'Livraison' }
const when = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })

/** PUB-14 + MAIL-03 : confirmation au client et notification à l'équipe. */
export async function notifyAppointment(payload: Payload, a: Appointment) {
  const settings = await getSettings(payload)
  const vehicle = await vehicleOf(payload, a.vehicle)
  const rows: EmailBlock = {
    type: 'rows',
    rows: [
      ['Date', when(a.startsAt)],
      ['Motif', KIND_LABELS[a.kind]],
      ['Véhicule', vehicle?.title],
      ['Adresse', [settings.company?.address, settings.company?.postalCode, settings.company?.city].filter(Boolean).join(' ')],
    ],
  }
  await sendEmail(payload, {
    to: a.email,
    subject: `Rendez-vous confirmé le ${when(a.startsAt)}`,
    html: renderEmail({ settings, title: 'Votre rendez-vous est confirmé', blocks: [{ type: 'p', text: `Bonjour ${a.name},` }, rows, { type: 'p', text: 'Un empêchement ? Appelez-nous pour décaler le rendez-vous.' }] }),
  })
  await sendEmail(payload, {
    to: internalRecipients(settings),
    replyTo: a.email,
    subject: `[Rendez-vous] ${a.name} · ${when(a.startsAt)}`,
    html: renderEmail({ settings, title: `Nouveau rendez-vous : ${a.name}`, blocks: [rows, { type: 'rows', rows: [['Téléphone', a.phone], ['E-mail', a.email]] }] }),
  })
}

/** AUTO-03 : rappel la veille du rendez-vous. */
export async function remindAppointment(payload: Payload, a: Appointment) {
  const settings = await getSettings(payload)
  return sendEmail(payload, {
    to: a.email,
    subject: `Rappel : rendez-vous demain chez Lease Auto`,
    html: renderEmail({
      settings,
      title: 'À demain !',
      blocks: [
        { type: 'p', text: `Bonjour ${a.name}, nous vous attendons ${when(a.startsAt)} pour votre ${KIND_LABELS[a.kind].toLowerCase()}.` },
        ...(settings.company?.mapsUrl ? [{ type: 'button' as const, label: 'Itinéraire', href: settings.company.mapsUrl }] : []),
      ],
    }),
  })
}

const unsubscribeNote = (s: Subscriber) =>
  `Vous recevez cet e-mail car vous êtes inscrit aux alertes ou à la newsletter Lease Auto. <a href="${siteUrl()}/desinscription?token=${s.unsubscribeToken}" style="color:#fff">Se désinscrire en un clic</a>.`

const vehicleCardHtml = (v: Vehicle) => {
  const photo = v.gallery?.find((m): m is Media => typeof m === 'object')
  const img = photo?.sizes?.card?.url ?? photo?.url
  const src = img ? (img.startsWith('http') ? img : `${siteUrl()}${img}`) : null
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border:1px solid #e4e8f0;border-radius:12px;overflow:hidden">
${src ? `<tr><td><img src="${src}" alt="" width="544" style="display:block;width:100%;height:auto"></td></tr>` : ''}
<tr><td style="padding:14px 16px"><a href="${siteUrl()}/vehicule/${v.slug}" style="font-size:16px;font-weight:700;color:#0d2449;text-decoration:none">${v.title}</a>
<p style="margin:6px 0 0;font-size:13px;color:#4a5468">${v.year} · ${formatKm(v.mileage)} · <strong style="color:#0d2449">${formatEUR(v.price)}</strong>${v.monthlyFrom ? ` · <strong style="color:#de1d22">dès ${formatEUR(v.monthlyFrom)}/mois*</strong>` : ''}</p></td></tr></table>`
}

/** MAIL-04 / AUTO-05 : alerte aux abonnés dont les critères correspondent au véhicule publié. */
export async function sendVehicleAlerts(payload: Payload, vehicle: Vehicle) {
  const settings = await getSettings(payload)
  const brandId = typeof vehicle.brand === 'object' ? vehicle.brand.id : vehicle.brand
  const full = await payload.findByID({ collection: 'vehicles', id: vehicle.id, depth: 1 })
  let sent = 0
  let page = 1
  for (;;) {
    const res = await payload.find({ collection: 'subscribers', where: { alertEnabled: { equals: true } }, limit: 200, page, depth: 0 })
    for (const s of res.docs) {
      const c = s.criteria
      const brands = (c?.brands ?? []).map((b) => (typeof b === 'object' ? b.id : b))
      if (brands.length && !brands.includes(brandId)) continue
      if (c?.maxPrice && vehicle.price > c.maxPrice) continue
      if (c?.maxMonthly && (!vehicle.monthlyFrom || vehicle.monthlyFrom > c.maxMonthly)) continue
      if (c?.maxMileage && vehicle.mileage > c.maxMileage) continue
      if (c?.fuels?.length && !c.fuels.includes(vehicle.fuel)) continue
      const ok = await sendEmail(payload, {
        to: s.email,
        subject: `Nouveau : ${vehicle.title}`,
        html: renderEmail({
          settings,
          title: 'Un véhicule correspond à votre alerte',
          blocks: [{ type: 'html', html: vehicleCardHtml(full) }, { type: 'button', label: 'Voir le véhicule', href: `${siteUrl()}/vehicule/${vehicle.slug}` }],
          footerNote: unsubscribeNote(s),
        }),
      })
      if (ok) sent++
    }
    if (!res.hasNextPage) break
    page++
  }
  return sent
}

/** MAIL-05 : newsletter (sélection de véhicules ou offre) envoyée depuis l'administration. */
export async function sendCampaign(payload: Payload, campaign: { subject: string; intro?: string | null; vehicles?: (number | Vehicle)[] | null }) {
  const settings = await getSettings(payload)
  const vehicles = (campaign.vehicles ?? []).filter((v): v is Vehicle => typeof v === 'object')
  let sent = 0
  let page = 1
  for (;;) {
    const res = await payload.find({ collection: 'subscribers', where: { newsletter: { equals: true } }, limit: 200, page, depth: 0 })
    for (const s of res.docs) {
      const ok = await sendEmail(payload, {
        to: s.email,
        subject: campaign.subject,
        html: renderEmail({
          settings,
          title: campaign.subject,
          blocks: [
            ...(campaign.intro ? [{ type: 'p' as const, text: campaign.intro }] : []),
            ...vehicles.map((v) => ({ type: 'html' as const, html: vehicleCardHtml(v) })),
            { type: 'button', label: 'Voir tout le stock', href: `${siteUrl()}/vehicules` },
            { type: 'p', text: `* ${CREDIT_WARNING}` },
          ],
          footerNote: unsubscribeNote(s),
        }),
      })
      if (ok) sent++
    }
    if (!res.hasNextPage) break
    page++
  }
  return sent
}
