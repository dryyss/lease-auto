import type { Metadata } from 'next'

import { LegalPage } from '@/components/ui/LegalPage'

export const metadata: Metadata = { title: 'Mentions légales', alternates: { canonical: '/mentions-legales' } }

export default function Page() {
  return <LegalPage kind="legalNotice" title="Mentions légales" />
}
