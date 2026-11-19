import type { Payload } from 'payload'

import type { Appointment, Media, Request, Subscriber, Vehicle } from '@/payload-types'

import { manageAppointmentUrl } from './appointment-link'
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

/** Espace acheteur, référence déjà remplie : il ne reste au client qu'à saisir son e-mail. */
const spaceUrl = (r: Request) => `${siteUrl()}/mon-espace${r.reference ? `?ref=${encodeURIComponent(r.reference)}` : ''}`

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
          ? [{ type: 'p' as const, text: 'Votre dossier est étudié une fois vos justificatifs reçus : déposez-les depuis votre espace (bouton ci-dessous) ou en répondant à cet e-mail.' }]
          : [{ type: 'p' as const, text: 'Suivez l’avancement de votre demande depuis votre espace : votre référence et votre e-mail suffisent.' }]),
        { type: 'button', label: missingDocs ? 'Déposer mes justificatifs' : 'Suivre ma demande', href: spaceUrl(r) },
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
        { type: 'button', label: 'Ouvrir la demande', href: `${siteUrl()}/gestion/demandes/${r.id}` },
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
        // Dossier clos (refus, livraison) : plus rien à suivre ni à déposer, pas de bouton.
        ...(r.status === 'review' || r.status === 'approved' ? [{ type: 'button' as const, label: 'Suivre mon dossier', href: spaceUrl(r) }] : []),
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
        { type: 'p', text: 'Déposez-les depuis votre espace (PDF ou photos lisibles) : votre référence et votre e-mail suffisent pour l’ouvrir. Vous pouvez aussi répondre à cet e-mail avec vos documents, ou les envoyer sur WhatsApp.' },
        { type: 'button', label: 'Déposer mes justificatifs', href: spaceUrl(r) },
      ],
    }),
    replyTo: settings.company?.email ?? undefined,
  })
}

/**
 * Le client a déposé des pièces depuis son espace : le conseiller du dossier et l'équipe sont prévenus.
 * Un seul e-mail par séance de dépôt (le client envoie ses pièces une par une), pas un par fichier.
 */
export async function notifyDocumentsReceived(payload: Payload, r: Request, count: number, kindLabel: string) {
  const recent = await payload.count({
    collection: 'documents',
    where: { and: [{ request: { equals: r.id } }, { createdAt: { greater_than: new Date(Date.now() - 30 * 60_000).toISOString() } }] },
    overrideAccess: true,
  })
  if (recent.totalDocs > count) return false

  const settings = await getSettings(payload)
  const advisorId = r.assignedTo && typeof r.assignedTo === 'object' ? r.assignedTo.id : r.assignedTo
  const advisor = advisorId ? await payload.findByID({ collection: 'users', id: advisorId, depth: 0, overrideAccess: true }).catch(() => null) : null
  const to = [...new Set([...(advisor?.email && !advisor.disabled ? [advisor.email] : []), ...internalRecipients(settings)])]
  return sendEmail(payload, {
    to,
    replyTo: r.email,
    subject: `[Pièces reçues] ${r.firstName} ${r.lastName} · ${r.reference}`,
    html: renderEmail({
      settings,
      title: `${r.firstName} ${r.lastName} a déposé des justificatifs`,
      blocks: [
        { type: 'rows', rows: [['Référence', r.reference], ['Première pièce reçue', kindLabel], ['Téléphone', r.phone], ['Suivi par', advisor?.name]] },
        { type: 'p', text: 'Le client dépose ses pièces depuis son espace : d’autres peuvent suivre. Vérifiez-les, puis marquez le dossier complet sur la fiche de la demande.' },
        { type: 'button', label: 'Ouvrir le dossier', href: `${siteUrl()}/gestion/demandes/${r.id}` },
      ],
    }),
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
        { type: 'button', label: 'Ouvrir les demandes', href: `${siteUrl()}/gestion/demandes?statut=new` },
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

const appointmentRows = async (payload: Payload, a: Appointment, settings: Awaited<ReturnType<typeof getSettings>>): Promise<EmailBlock> => {
  const vehicle = await vehicleOf(payload, a.vehicle)
  return {
    type: 'rows',
    rows: [
      ['Date', when(a.startsAt)],
      ['Motif', KIND_LABELS[a.kind]],
      ['Véhicule', vehicle?.title],
      ['Adresse', [settings.company?.address, settings.company?.postalCode, settings.company?.city].filter(Boolean).join(' ')],
    ],
  }
}

const manageButton = (a: Appointment): EmailBlock => ({ type: 'button', label: 'Annuler ou changer de créneau', href: manageAppointmentUrl(a) })

/** PUB-14 + MAIL-03 : confirmation au client et notification à l'équipe. Renvoie true si l'e-mail du client est parti. */
export async function notifyAppointment(payload: Payload, a: Appointment, { team = true }: { team?: boolean } = {}) {
  const settings = await getSettings(payload)
  const rows = await appointmentRows(payload, a, settings)
  const sent = await sendEmail(payload, {
    to: a.email,
    subject: `Rendez-vous confirmé le ${when(a.startsAt)}`,
    html: renderEmail({
      settings,
      title: 'Votre rendez-vous est confirmé',
      blocks: [{ type: 'p', text: `Bonjour ${a.name},` }, rows, { type: 'p', text: 'Un empêchement ? Annulez ou choisissez un autre créneau en un clic :' }, manageButton(a)],
    }),
  })
  if (team)
    await sendEmail(payload, {
      to: internalRecipients(settings),
      replyTo: a.email,
      subject: `[Rendez-vous] ${a.name} · ${when(a.startsAt)}`,
      html: renderEmail({ settings, title: `Nouveau rendez-vous : ${a.name}`, blocks: [rows, { type: 'rows', rows: [['Téléphone', a.phone], ['E-mail', a.email]] }, { type: 'button', label: 'Voir les rendez-vous', href: `${siteUrl()}/gestion/rendez-vous` }] }),
    })
  return sent
}

const parisDay = (ms: number) => new Date(ms).toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' })

/** AUTO-03 : rappel avant le rendez-vous (« demain » ou « aujourd'hui » selon le jour). */
export async function remindAppointment(payload: Payload, a: Appointment) {
  const settings = await getSettings(payload)
  const today = parisDay(Date.now()) === parisDay(new Date(a.startsAt).getTime())
  return sendEmail(payload, {
    to: a.email,
    subject: today ? 'Rappel : rendez-vous aujourd’hui chez Lease Auto' : 'Rappel : rendez-vous demain chez Lease Auto',
    html: renderEmail({
      settings,
      title: today ? 'À tout à l’heure !' : 'À demain !',
      blocks: [
        { type: 'p', text: `Bonjour ${a.name}, nous vous attendons ${when(a.startsAt)} pour votre ${KIND_LABELS[a.kind].toLowerCase()}.` },
        ...(settings.company?.mapsUrl ? [{ type: 'button' as const, label: 'Itinéraire', href: settings.company.mapsUrl }] : []),
        { type: 'p', text: 'Un empêchement ? Prévenez-nous en un clic pour libérer le créneau :' },
        manageButton(a),
      ],
    }),
  })
}

/** Rendez-vous annulé : par l'agence (le client est prévenu) ou par le client (confirmation + alerte à l'équipe). */
export async function notifyAppointmentCancelled(payload: Payload, a: Appointment, by: 'agency' | 'client') {
  const settings = await getSettings(payload)
  const rows = await appointmentRows(payload, a, settings)
  const sent = await sendEmail(payload, {
    to: a.email,
    subject: `Rendez-vous du ${when(a.startsAt)} annulé`,
    html: renderEmail({
      settings,
      title: 'Votre rendez-vous est annulé',
      blocks: [
        { type: 'p', text: by === 'client' ? `Bonjour ${a.name}, nous avons bien noté l’annulation de votre rendez-vous :` : `Bonjour ${a.name}, nous sommes contraints d’annuler votre rendez-vous :` },
        rows,
        { type: 'p', text: 'Vous pouvez choisir un nouveau créneau à tout moment.' },
        { type: 'button', label: 'Prendre un nouveau rendez-vous', href: `${siteUrl()}/rendez-vous` },
      ],
    }),
  })
  if (by === 'client')
    await sendEmail(payload, {
      to: internalRecipients(settings),
      replyTo: a.email,
      subject: `[Rendez-vous annulé par le client] ${a.name} · ${when(a.startsAt)}`,
      html: renderEmail({ settings, title: `${a.name} a annulé son rendez-vous`, blocks: [rows, { type: 'rows', rows: [['Téléphone', a.phone], ['E-mail', a.email]] }, { type: 'p', text: 'Le créneau est de nouveau proposé sur le site.' }] }),
    })
  return sent
}

/** Rendez-vous déplacé : nouveau créneau au client ; si c'est lui qui l'a changé, l'équipe est prévenue. */
export async function notifyAppointmentMoved(payload: Payload, a: Appointment, previous: string, by: 'agency' | 'client') {
  const settings = await getSettings(payload)
  const rows = await appointmentRows(payload, a, settings)
  const sent = await sendEmail(payload, {
    to: a.email,
    subject: `Nouveau créneau : ${when(a.startsAt)}`,
    html: renderEmail({
      settings,
      title: 'Votre rendez-vous a changé d’horaire',
      blocks: [
        { type: 'p', text: `Bonjour ${a.name}, votre rendez-vous initialement prévu ${when(previous)} est déplacé :` },
        rows,
        { type: 'p', text: 'Ce nouvel horaire ne vous convient pas ?' },
        manageButton(a),
      ],
    }),
  })
  if (by === 'client')
    await sendEmail(payload, {
      to: internalRecipients(settings),
      replyTo: a.email,
      subject: `[Rendez-vous déplacé par le client] ${a.name} · ${when(a.startsAt)}`,
      html: renderEmail({ settings, title: `${a.name} a changé de créneau`, blocks: [{ type: 'rows', rows: [['Ancien créneau', when(previous)]] }, rows, { type: 'rows', rows: [['Téléphone', a.phone], ['E-mail', a.email]] }] }),
    })
  return sent
}

/** E-mail de test (Réglages) : vérifie l'envoi de bout en bout. */
export async function sendTestEmail(payload: Payload, to: string[]) {
  const settings = await getSettings(payload)
  return sendEmail(payload, {
    to,
    subject: 'Test d’envoi Lease Auto',
    html: renderEmail({ settings, title: 'Les e-mails fonctionnent', blocks: [{ type: 'p', text: 'Cet e-mail de test a été envoyé depuis la page Réglages de la gestion. Les confirmations, rappels et annulations de rendez-vous partent de la même façon.' }] }),
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
