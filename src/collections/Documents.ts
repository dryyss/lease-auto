import type { CollectionConfig } from 'payload'

import { admins, staff } from '@/access'

// ADM-05 / CONF-02 : justificatifs clients. Jamais publics, supprimés après le délai défini dans les Réglages.
export const Documents: CollectionConfig = {
  slug: 'documents',
  labels: { singular: 'Justificatif', plural: 'Justificatifs' },
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'kind', 'request', 'deleteAfter', 'createdAt'],
    group: 'Clients',
  },
  access: { read: staff, create: staff, update: staff, delete: admins },
  upload: {
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/webp'],
    // Hors de /public : les fichiers ne sont servis que par l'API, avec contrôle d'accès.
    staticDir: 'private/documents',
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation !== 'create' || data.deleteAfter) return data
        const settings = await req.payload.findGlobal({ slug: 'settings', req, depth: 0 })
        const days = settings.retention?.documentsDays ?? 90
        data.deleteAfter = new Date(Date.now() + days * 86_400_000).toISOString()
        return data
      },
    ],
  },
  fields: [
    { name: 'request', label: 'Demande', type: 'relationship', relationTo: 'requests', index: true },
    {
      name: 'kind',
      label: 'Type de pièce',
      type: 'select',
      options: [
        { label: 'Pièce d’identité', value: 'id' },
        { label: 'Justificatif de domicile', value: 'address' },
        { label: 'Bulletins de salaire', value: 'payslips' },
        { label: 'Avis d’imposition', value: 'tax' },
        { label: 'RIB', value: 'rib' },
        { label: 'Kbis / SIREN', value: 'kbis' },
        { label: 'Bilans / liasses fiscales', value: 'accounts' },
        { label: 'Relevés bancaires', value: 'bank' },
        { label: 'Photo véhicule (reprise)', value: 'tradein-photo' },
        { label: 'Autre', value: 'other' },
      ],
    },
    { name: 'deleteAfter', label: 'Suppression prévue le', type: 'date', index: true, admin: { position: 'sidebar' } },
  ],
}
