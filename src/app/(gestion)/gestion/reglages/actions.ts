'use server'

import { revalidatePath } from 'next/cache'

import { fieldName, normalizeSocial, validateSettings,type FormulaInput, type Result, type SettingsInput } from '@/components/gestion/reglages/shared'
import { markdownToRichText } from '@/lib/gestion/richtext'
import { internalRecipients } from '@/lib/email'
import { isAdminUser, requireStaff } from '@/lib/gestion/session'
import { sendTestEmail } from '@/lib/notifications'
import { emailEnabled } from '@/lib/services'

const t = (v: string) => v.trim() || null

const formula = (f: FormulaInput, withResidual: boolean) => ({
  enabled: f.enabled,
  annualRate: f.annualRate,
  taeg: f.taeg,
  minMonths: f.minMonths,
  maxMonths: f.maxMonths,
  defaultMonths: f.defaultMonths,
  defaultDepositPercent: f.defaultDepositPercent,
  ...(withResidual ? { residualPercent: f.residualPercent } : {}),
  representativeExample: t(f.representativeExample),
})

/** Enregistre tous les réglages du site (administrateurs) et rafraîchit tout le site. */
export async function saveSettings(v: SettingsInput): Promise<Result> {
  const { payload, user } = await requireStaff()
  if (!isAdminUser(user)) return { ok: false, error: 'Réservé aux administrateurs.' }

  const fields = validateSettings(v)
  if (Object.keys(fields).length) {
    const names = [...new Set(Object.keys(fields).map(fieldName))]
    return { ok: false, error: `À corriger : ${names.join(', ')}.`, fields }
  }

  try {
    // Textes riches non modifiés : on renvoie la version enregistrée, intacte.
    const current = await payload.findGlobal({ slug: 'settings', depth: 0, user, overrideAccess: false })
    const rich = async (md: string | null, saved: unknown) => (md === null ? saved : await markdownToRichText(md))
    const c = v.company

    await payload.updateGlobal({
      slug: 'settings',
      data: {
        company: {
          name: t(c.name),
          legalForm: t(c.legalForm),
          siren: t(c.siren),
          rcs: t(c.rcs),
          orias: t(c.orias),
          address: t(c.address),
          postalCode: t(c.postalCode),
          city: t(c.city),
          phone: t(c.phone),
          whatsapp: t(c.whatsapp),
          email: t(c.email),
          notificationEmails: [...new Set(c.notificationEmails.map((m) => m.trim().toLowerCase()).filter(Boolean))],
          mapsUrl: t(c.mapsUrl),
          googleReviewUrl: t(c.googleReviewUrl),
        },
        openingHours: v.openingHours.map((h) => ({ ...(h.id ? { id: h.id } : {}), days: h.days.trim(), hours: h.hours.trim() })),
        social: {
          facebook: t(normalizeSocial('facebook', v.social.facebook)),
          instagram: t(normalizeSocial('instagram', v.social.instagram)),
          tiktok: t(normalizeSocial('tiktok', v.social.tiktok)),
        },
        financing: {
          loa: formula(v.financing.loa, true),
          lld: formula(v.financing.lld, true),
          credit: formula(v.financing.credit, false),
          legalNotice: v.financing.legalNotice.trim(),
        },
        retention: v.retention,
        legalNotice: (await rich(v.legal.legalNotice, current.legalNotice)) as never,
        privacyPolicy: (await rich(v.legal.privacyPolicy, current.privacyPolicy)) as never,
        terms: (await rich(v.legal.terms, current.terms)) as never,
      },
      depth: 0,
      user,
      overrideAccess: false,
    })
  } catch (err) {
    const e = err as { status?: number; data?: { errors?: { path?: string; message?: string }[] } }
    if (e?.status === 403) return { ok: false, error: 'Vous n’avez pas le droit de modifier les réglages.' }
    const list = e?.data?.errors
    if (Array.isArray(list) && list.length) {
      const fields = Object.fromEntries(list.map((x) => [String(x.path ?? 'form'), 'Valeur non valable.']))
      return { ok: false, error: `À corriger : ${[...new Set(Object.keys(fields).map(fieldName))].join(', ')}.`, fields }
    }
    payload.logger.error({ err }, 'Gestion réglages : enregistrement impossible')
    return { ok: false, error: 'L’enregistrement a échoué. Réessayez ; si cela continue, prévenez l’administrateur du site.' }
  }

  // Coordonnées, horaires, taux et mentions sont affichés partout : tout le site est rafraîchi.
  revalidatePath('/', 'layout')
  return { ok: true }
}

/** « Envoyer un e-mail de test » : aux adresses qui reçoivent les alertes de l'équipe, sinon à l'administrateur. */
export async function sendSettingsTestEmail(): Promise<Result> {
  const { payload, user } = await requireStaff()
  if (!isAdminUser(user)) return { ok: false, error: 'Réservé aux administrateurs.' }
  if (!emailEnabled()) return { ok: false, error: 'L’envoi d’e-mails (Resend) n’est pas encore branché : aucun e-mail ne peut partir.' }
  const settings = await payload.findGlobal({ slug: 'settings', depth: 0 })
  const to = internalRecipients(settings)
  const recipients = to.length ? to : [user.email]
  const sent = await sendTestEmail(payload, recipients)
  return sent ? { ok: true } : { ok: false, error: 'L’e-mail n’a pas pu partir. Vérifiez le domaine d’envoi dans Resend, puis réessayez.' }
}
