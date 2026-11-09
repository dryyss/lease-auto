import type { Metadata } from 'next'

import { LegalPage } from '@/components/ui/LegalPage'

export const metadata: Metadata = {
  title: 'Conditions générales',
  description: 'Conditions générales d’utilisation du site Lease Auto et de ses services : simulation, demande de financement, rendez-vous et reprise.',
  alternates: { canonical: '/conditions-generales' },
}

export default function Page() {
  return <LegalPage kind="terms" title="Conditions générales" />
}
