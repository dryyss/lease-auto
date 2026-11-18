import type { Metadata } from 'next'

import { CampaignForm } from '@/components/gestion/newsletters/CampaignForm'
import { EmailWarning } from '@/components/gestion/newsletters/EmailWarning'
import { countRecipients, loadVehicleOptions } from '@/components/gestion/newsletters/load'
import { PageHeader } from '@/components/gestion/ui'
import { requireStaff } from '@/lib/gestion/session'
import { emailEnabled } from '@/lib/services'

export const metadata: Metadata = { title: 'Nouvelle newsletter' }

export default async function NewCampaignPage() {
  const { payload, user } = await requireStaff()
  const [options, recipients] = await Promise.all([
    loadVehicleOptions(payload, user),
    countRecipients(payload, user),
  ])
  return (
    <>
      <PageHeader
        title="Nouvelle newsletter"
        subtitle="Enregistrez le brouillon, vérifiez l’aperçu, puis envoyez-la depuis sa fiche."
        back={{ href: '/gestion/newsletters', label: 'Newsletters' }}
      />
      {!emailEnabled() && <EmailWarning />}
      <CampaignForm
        initial={{ subject: '', intro: '', vehicles: [] }}
        options={options}
        recipients={recipients}
        emailOn={emailEnabled()}
      />
    </>
  )
}
