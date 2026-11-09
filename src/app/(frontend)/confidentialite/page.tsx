import type { Metadata } from 'next'

import { LegalPage } from '@/components/ui/LegalPage'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Données collectées par Lease Auto lors d’une demande de financement, durée de conservation, destinataires et exercice de vos droits (RGPD).',
  alternates: { canonical: '/confidentialite' },
}

export default function Page() {
  return <LegalPage kind="privacyPolicy" title="Politique de confidentialité" />
}
