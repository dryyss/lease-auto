import type { Metadata } from 'next'

import { LegalPage } from '@/components/ui/LegalPage'

export const metadata: Metadata = { title: 'Politique de confidentialité', alternates: { canonical: '/confidentialite' } }

export default function Page() {
  return <LegalPage kind="privacyPolicy" title="Politique de confidentialité" />
}
