'use server'

import { revalidatePath } from 'next/cache'
import type { Payload } from 'payload'

import { errorMessage, fail, type Result } from '@/components/gestion/rendez-vous/result'
import { countRecipients } from '@/components/gestion/newsletters/load'
import { CREDIT_WARNING } from '@/lib/credit-legal'
import { renderEmail, siteUrl, type EmailBlock } from '@/lib/email'
import { formatEUR, formatKm } from '@/lib/format'
import { requireStaff, type Staff } from '@/lib/gestion/session'
import { emailEnabled } from '@/lib/services'
import type { Media, Vehicle } from '@/payload-types'

export type CampaignInput = { id?: number; subject: string; intro: string; vehicles: number[] }

const MAX_VEHICLES = 6

function clean(
  input: CampaignInput,
):
  | { ok: true; data: { subject: string; intro: string | null; vehicles: number[] } }
  | { ok: false; error: string } {
  const subject = input.subject.replace(/\s+/g, ' ').trim().slice(0, 150)
  const intro = input.intro.replace(/\r\n/g, '\n').trim().slice(0, 3000)
  const vehicles = [...new Set(input.vehicles.filter((v) => Number.isInteger(v) && v > 0))]
  if (!subject) return { ok: false, error: 'Indiquez l’objet de la newsletter.' }
  if (vehicles.length > MAX_VEHICLES)
    return { ok: false, error: `${MAX_VEHICLES} véhicules au maximum.` }
  return { ok: true, data: { subject, intro: intro || null, vehicles } }
}

const refresh = (id?: number) => {
  revalidatePath('/gestion/newsletters')
  if (id) revalidatePath(`/gestion/newsletters/${id}`)
}

async function loadDraft(payload: Payload, user: Staff, id: number) {
  const doc = await payload
    .findByID({ collection: 'campaigns', id, depth: 0, user, overrideAccess: false })
    .catch(() => null)
  if (!doc) return { error: 'Cette newsletter n’existe plus.' }
  if (doc.status === 'sent')
    return {
      error: 'Cette newsletter est déjà envoyée : elle ne peut plus être modifiée ni renvoyée.',
    }
  return { doc }
}

/** Enregistre le brouillon (création si pas d'id). N'envoie rien. */
export async function saveCampaign(
  input: CampaignInput,
): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  const { payload, user } = await requireStaff()
  const c = clean(input)
  if (!c.ok) return c
  try {
    if (input.id) {
      const { error } = await loadDraft(payload, user, input.id)
      if (error) return { ok: false, error }
      await payload.update({
        collection: 'campaigns',
        id: input.id,
        data: { ...c.data, sendNow: false },
        depth: 0,
        user,
        overrideAccess: false,
      })
      refresh(input.id)
      return { ok: true, id: input.id }
    }
    const doc = await payload.create({
      collection: 'campaigns',
      data: { ...c.data, status: 'draft', sendNow: false },
      depth: 0,
      user,
      overrideAccess: false,
    })
    refresh()
    return { ok: true, id: doc.id }
  } catch (err) {
    return { ok: false, error: errorMessage(err) }
  }
}

/**
 * Envoi : enregistre les derniers changements avec « sendNow » coché, comme dans l'ancienne interface.
 * C'est le hook de la collection (afterChange → sendCampaign) qui envoie et passe la newsletter en « Envoyée ».
 */
export async function sendCampaignNow(
  input: CampaignInput,
): Promise<{ ok: true; sentCount: number; recipients: number } | { ok: false; error: string }> {
  const { payload, user } = await requireStaff()
  if (!emailEnabled())
    return {
      ok: false,
      error:
        'L’envoi d’e-mails n’est pas branché sur ce site (clé RESEND_API_KEY absente). Rien n’a été envoyé.',
    }
  if (!input.id) return { ok: false, error: 'Enregistrez d’abord le brouillon.' }
  const c = clean(input)
  if (!c.ok) return c
  const { error } = await loadDraft(payload, user, input.id)
  if (error) return { ok: false, error }
  const recipients = await countRecipients(payload, user)
  if (!recipients)
    return { ok: false, error: 'Aucun abonné n’est inscrit à la newsletter : rien à envoyer.' }
  try {
    await payload.update({
      collection: 'campaigns',
      id: input.id,
      data: { ...c.data, sendNow: true },
      depth: 0,
      user,
      overrideAccess: false,
    })
    const after = await payload.findByID({
      collection: 'campaigns',
      id: input.id,
      depth: 0,
      user,
      overrideAccess: false,
    })
    refresh(input.id)
    if (after.status !== 'sent')
      return {
        ok: false,
        error: 'L’envoi n’a pas abouti. Vérifiez la configuration des e-mails puis réessayez.',
      }
    return { ok: true, sentCount: after.sentCount ?? 0, recipients }
  } catch (err) {
    return { ok: false, error: errorMessage(err) }
  }
}

export async function deleteCampaign(id: number): Promise<Result> {
  const { payload, user } = await requireStaff()
  const { error } = await loadDraft(payload, user, id)
  if (error) return fail(error)
  try {
    await payload.delete({ collection: 'campaigns', id, depth: 0, user, overrideAccess: false })
  } catch (err) {
    return fail(errorMessage(err))
  }
  refresh()
  return { ok: true }
}

const esc = (s: unknown) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!,
  )

/** Même carte que vehicleCardHtml (src/lib/notifications.ts, non exportée), pour un aperçu fidèle. */
function vehicleCard(v: Vehicle) {
  const photo = v.gallery?.find((m): m is Media => typeof m === 'object')
  const img = photo?.sizes?.card?.url ?? photo?.url
  const src = img ? (img.startsWith('http') ? img : `${siteUrl()}${img}`) : null
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border:1px solid #e4e8f0;border-radius:12px;overflow:hidden">
${src ? `<tr><td><img src="${esc(src)}" alt="" width="544" style="display:block;width:100%;height:auto"></td></tr>` : ''}
<tr><td style="padding:14px 16px"><a href="${siteUrl()}/vehicule/${esc(v.slug)}" style="font-size:16px;font-weight:700;color:#0d2449;text-decoration:none">${esc(v.title)}</a>
<p style="margin:6px 0 0;font-size:13px;color:#4a5468">${v.year} · ${formatKm(v.mileage)} · <strong style="color:#0d2449">${formatEUR(v.price)}</strong>${v.monthlyFrom ? ` · <strong style="color:#de1d22">dès ${formatEUR(v.monthlyFrom)}/mois*</strong>` : ''}</p></td></tr></table>`
}

/** Aperçu HTML de l'e-mail tel qu'il partira (mêmes blocs que sendCampaign). */
export async function previewCampaign(
  input: CampaignInput,
): Promise<{ ok: true; html: string } | { ok: false; error: string }> {
  const { payload, user } = await requireStaff()
  const c = clean({ ...input, subject: input.subject || 'Objet de la newsletter' })
  if (!c.ok) return c
  try {
    const [settings, found] = await Promise.all([
      payload
        .findGlobal({ slug: 'settings', depth: 0, user, overrideAccess: false })
        .catch(() => null),
      c.data.vehicles.length
        ? payload.find({
            collection: 'vehicles',
            where: { id: { in: c.data.vehicles } },
            depth: 1,
            limit: MAX_VEHICLES,
            user,
            overrideAccess: false,
          })
        : Promise.resolve({ docs: [] as Vehicle[] }),
    ])
    // Dans l'ordre choisi.
    const vehicles = c.data.vehicles
      .map((id) => found.docs.find((v) => v.id === id))
      .filter((v): v is Vehicle => !!v)
    const blocks: EmailBlock[] = [
      ...(c.data.intro ? [{ type: 'p' as const, text: c.data.intro }] : []),
      ...vehicles.map((v) => ({ type: 'html' as const, html: vehicleCard(v) })),
      { type: 'button', label: 'Voir tout le stock', href: `${siteUrl()}/vehicules` },
      { type: 'p', text: `* ${CREDIT_WARNING}` },
    ]
    const html = renderEmail({
      settings,
      title: c.data.subject,
      blocks,
      footerNote:
        'Vous recevez cet e-mail car vous êtes inscrit aux alertes ou à la newsletter Lease Auto. <a href="#" style="color:#fff">Se désinscrire en un clic</a>.',
    })
    return { ok: true, html }
  } catch (err) {
    return { ok: false, error: errorMessage(err) }
  }
}
