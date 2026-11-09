import type { Metadata } from 'next'

import { LegalPage } from '@/components/ui/LegalPage'

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Mentions légales de Lease Auto, Épinay-sur-Seine : éditeur du site, hébergeur, immatriculation et statut d’intermédiaire en financement.',
  alternates: { canonical: '/mentions-legales' },
}

export default function Page() {
  return <LegalPage kind="legalNotice" title="Mentions légales" />
}
