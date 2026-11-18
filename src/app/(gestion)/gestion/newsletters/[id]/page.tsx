import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CampaignForm } from '@/components/gestion/newsletters/CampaignForm'
import { EmailWarning } from '@/components/gestion/newsletters/EmailWarning'
import { countRecipients, loadVehicleOptions } from '@/components/gestion/newsletters/load'
import { Badge, PageHeader } from '@/components/gestion/ui'
import { fmtDateTime, plural } from '@/lib/gestion/labels'
import { requireStaff } from '@/lib/gestion/session'
import { emailEnabled } from '@/lib/services'

export const metadata: Metadata = { title: 'Newsletter' }
// L'envoi (action serveur de cette page) envoie les e-mails un par un : on laisse plus de temps à la fonction.
export const maxDuration = 300

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id <= 0) notFound()
  const { payload, user } = await requireStaff()
  const doc = await payload
    .findByID({ collection: 'campaigns', id, depth: 0, user, overrideAccess: false })
    .catch(() => null)
  if (!doc) notFound()

  const vehicles = (doc.vehicles ?? []).map((v) => (typeof v === 'object' ? v.id : v))
  const [options, recipients] = await Promise.all([
    loadVehicleOptions(payload, user, vehicles),
    countRecipients(payload, user),
  ])
  const sent = doc.status === 'sent'

  return (
    <>
      <PageHeader
        title={doc.subject}
        subtitle={
          sent ? (
            <>
              <Badge className="mr-2 bg-emerald-600 text-white">Envoyée</Badge>
              le {fmtDateTime(doc.sentAt)} à {plural(doc.sentCount ?? 0, 'destinataire')}.
            </>
          ) : (
            <>
              <Badge className="mr-2 bg-white text-ink-2 ring-1 ring-line">Brouillon</Badge>
              Pas encore envoyée.
            </>
          )
        }
        back={{ href: '/gestion/newsletters', label: 'Newsletters' }}
      />
      {!sent && !emailEnabled() && <EmailWarning />}
      <CampaignForm
        initial={{ id: doc.id, subject: doc.subject, intro: doc.intro ?? '', vehicles }}
        sent={sent}
        options={options}
        recipients={recipients}
        emailOn={emailEnabled()}
      />
    </>
  )
}
