import config from '@payload-config'
import { getPayload } from 'payload'

import { runAutomations } from '@/lib/automations'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Appelée toutes les heures par GitHub Actions (.github/workflows/automatisations.yml),
// avec « Authorization: Bearer $CRON_SECRET ».
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const payload = await getPayload({ config })
  const report = await runAutomations(payload)
  payload.logger.info({ report }, 'Automatisations exécutées')
  return Response.json({ ok: true, report })
}
