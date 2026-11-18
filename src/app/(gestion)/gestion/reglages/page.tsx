import { Lock } from 'lucide-react'
import type { Metadata } from 'next'

import { SettingsForm } from '@/components/gestion/reglages/SettingsForm'
import { toInput } from '@/components/gestion/reglages/shared'
import { Card, Empty, PageHeader } from '@/components/gestion/ui'
import { ago } from '@/lib/gestion/labels'
import { richTextToMarkdown } from '@/lib/gestion/richtext'
import { isAdminUser, requireStaff } from '@/lib/gestion/session'

export const metadata: Metadata = { title: 'Réglages' }

export default async function ReglagesPage() {
  const { payload, user } = await requireStaff()
  if (!isAdminUser(user)) {
    return (
      <>
        <PageHeader title="Réglages" />
        <Card>
          <Empty icon={Lock} title="Réservé aux administrateurs." text="Les coordonnées, horaires, taux et mentions légales du site sont modifiés par un administrateur." />
        </Card>
      </>
    )
  }

  const doc = await payload.findGlobal({ slug: 'settings', depth: 0, user, overrideAccess: false })
  const [legalNotice, privacyPolicy, terms] = await Promise.all([richTextToMarkdown(doc.legalNotice), richTextToMarkdown(doc.privacyPolicy), richTextToMarkdown(doc.terms)])

  return (
    <>
      <PageHeader
        title="Réglages"
        subtitle={`Coordonnées, horaires, financement et mentions légales du site.${doc.updatedAt ? ` Modifiés ${ago(doc.updatedAt)}.` : ''}`}
      />
      <SettingsForm initial={toInput(doc, { legalNotice, privacyPolicy, terms })} />
    </>
  )
}
