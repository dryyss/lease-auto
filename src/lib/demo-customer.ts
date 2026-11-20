import type { Payload } from 'payload'

/** Le dossier de démonstration existe encore (il disparaît avec « pnpm seed:exemples supprimer »). */
export async function demoCustomerExists(payload: Payload): Promise<boolean> {
  const { totalDocs } = await payload.count({ collection: 'requests', where: { reference: { equals: DEMO_CUSTOMER.reference } }, overrideAccess: true })
  return totalDocs > 0
}

// Acheteur de démonstration (pnpm seed:exemples) : sert à montrer l'espace client. Supprimé avec les autres exemples.
export const DEMO_CUSTOMER = {
  email: 'camille.durand@example.com',
  firstName: 'Camille',
  lastName: 'Durand',
  phone: '06 12 00 00 00',
  reference: 'LA-DEMO-CLIENT',
} as const
