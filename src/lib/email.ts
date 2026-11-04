import type { Payload } from 'payload'

import type { Setting } from '@/payload-types'

const SITE = () => process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export type EmailBlock =
  | { type: 'p'; text: string }
  | { type: 'rows'; rows: [string, string | number | null | undefined][] }
  | { type: 'button'; label: string; href: string }
  | { type: 'html'; html: string }

/** MAIL-06 : gabarit unique aux couleurs Lease Auto, lisible sur mobile (tableaux + styles en ligne). */
export function renderEmail({
  title,
  blocks,
  settings,
  footerNote,
}: {
  title: string
  blocks: EmailBlock[]
  settings?: Setting | null
  footerNote?: string
}) {
  const c = settings?.company
  const body = blocks
    .map((b) => {
      if (b.type === 'p') return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155">${esc(b.text)}</p>`
      if (b.type === 'html') return b.html
      if (b.type === 'button')
        return `<p style="margin:24px 0"><a href="${esc(b.href)}" style="display:inline-block;background:#de1d22;color:#fff;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:12px;font-size:15px">${esc(b.label)}</a></p>`
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border:1px solid #e4e8f0;border-radius:12px;border-collapse:separate">${b.rows
        .filter(([, v]) => v !== null && v !== undefined && v !== '')
        .map(
          ([k, v]) =>
            `<tr><td style="padding:10px 14px;font-size:13px;color:#7c8699;border-bottom:1px solid #f1f5f9;width:42%">${esc(k)}</td><td style="padding:10px 14px;font-size:14px;color:#0d2449;font-weight:600;border-bottom:1px solid #f1f5f9">${esc(v)}</td></tr>`,
        )
        .join('')}</table>`
    })
    .join('')

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;background:#f4f6fa;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fa;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden">
<tr><td style="padding:22px 28px;border-bottom:4px solid #de1d22"><img src="${SITE()}/images/logo-lease-auto.png" alt="Lease Auto" width="170" style="display:block;height:auto"></td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 18px;font-size:22px;line-height:1.3;color:#0d2449">${esc(title)}</h1>
${body}
</td></tr>
<tr><td style="padding:20px 28px;background:#0d2449;color:#cbd5e1;font-size:12px;line-height:1.6">
<strong style="color:#fff">${esc(c?.name ?? 'Lease Auto')}</strong><br>
${esc([c?.address, [c?.postalCode, c?.city].filter(Boolean).join(' ')].filter(Boolean).join(', '))}<br>
${esc([c?.phone, c?.email].filter(Boolean).join(' · '))}
${c?.orias ? `<br>ORIAS n° ${esc(c.orias)}` : ''}
${footerNote ? `<br><br>${footerNote}` : ''}
</td></tr></table></td></tr></table></body></html>`
}

/** Envoi sans jamais faire échouer l'action de l'utilisateur : une panne d'e-mail est journalisée, pas propagée. */
export async function sendEmail(
  payload: Payload,
  { to, subject, html, replyTo }: { to: string | string[]; subject: string; html: string; replyTo?: string },
) {
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean)
  if (!recipients.length) return false
  try {
    await payload.sendEmail({ to: recipients, subject, html, ...(replyTo && { replyTo }) })
    return true
  } catch (err) {
    payload.logger.error({ err, subject }, 'Échec d’envoi d’e-mail')
    return false
  }
}

export const internalRecipients = (settings: Setting) => {
  const list = settings.company?.notificationEmails?.filter(Boolean) ?? []
  return list.length ? list : settings.company?.email ? [settings.company.email] : []
}

export const siteUrl = SITE
