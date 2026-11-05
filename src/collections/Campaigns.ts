import type { CollectionConfig } from 'payload'

import { staff } from '@/access'
import { sendCampaign } from '@/lib/notifications'

// MAIL-05 : newsletter créée et envoyée depuis l'administration, désinscription en un clic.
export const Campaigns: CollectionConfig = {
  slug: 'campaigns',
  labels: { singular: 'Newsletter', plural: 'Newsletters' },
  admin: { useAsTitle: 'subject', defaultColumns: ['subject', 'status', 'sentAt', 'sentCount'], group: 'Clients' },
  access: { read: staff, create: staff, update: staff, delete: staff },
  hooks: {
    afterChange: [
      async ({ doc, req, context }) => {
        if (context.skipSend || !doc.sendNow || doc.status === 'sent') return doc
        const full = await req.payload.findByID({ collection: 'campaigns', id: doc.id, depth: 2, req })
        const sentCount = await sendCampaign(req.payload, full)
        await req.payload.update({
          collection: 'campaigns',
          id: doc.id,
          data: { status: 'sent', sentAt: new Date().toISOString(), sentCount, sendNow: false },
          context: { skipSend: true },
          req,
        })
        return doc
      },
    ],
  },
  fields: [
    { name: 'subject', label: 'Objet', type: 'text', required: true },
    { name: 'intro', label: 'Texte d’introduction', type: 'textarea' },
    { name: 'vehicles', label: 'Véhicules présentés', type: 'relationship', relationTo: 'vehicles', hasMany: true, maxRows: 6 },
    {
      name: 'sendNow',
      label: 'Envoyer à tous les abonnés newsletter à l’enregistrement',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', condition: (data) => data?.status !== 'sent' },
    },
    {
      name: 'status',
      label: 'Statut',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Brouillon', value: 'draft' },
        { label: 'Envoyée', value: 'sent' },
      ],
      admin: { position: 'sidebar', readOnly: true, components: { Cell: '@/components/admin/StatusCell#StatusCell' } },
    },
    { name: 'sentAt', label: 'Envoyée le', type: 'date', admin: { position: 'sidebar', readOnly: true } },
    { name: 'sentCount', label: 'Destinataires', type: 'number', admin: { position: 'sidebar', readOnly: true } },
  ],
}
