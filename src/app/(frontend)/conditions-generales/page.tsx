import type { Metadata } from 'next'

import { LegalPage } from '@/components/ui/LegalPage'

export const metadata: Metadata = { title: 'Conditions générales', alternates: { canonical: '/conditions-generales' } }

export default function Page() {
  return <LegalPage kind="terms" title="Conditions générales" />
}
