import type { CollectionConfig } from 'payload'

import { staff } from '@/access'
import { notifyAppointment } from '@/lib/notifications'

// PUB-14 / ADM-06 : rendez-vous d'essai ou de passage en agence. Les créneaux sont définis dans le global « Agenda ».
export const Appointments: CollectionConfig = {
  slug: 'appointments',
  labels: { singular: 'Rendez-vous', plural: 'Rendez-vous' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['startsAt', 'name', 'kind', 'vehicle', 'status'],
    group: 'Clients',
  },
  access: { read: staff, create: staff, update: staff, delete: staff },
  defaultSort: 'startsAt',
  hooks: {
    afterChange: [
      async ({ doc, operation, req, context }) => {
        if (operation === 'create' && !context.skipEmails) await notifyAppointment(req.payload, doc)
        return doc
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'startsAt', label: 'Date et heure', type: 'date', required: true, index: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
        { name: 'kind', label: 'Motif', type: 'select', required: true, options: [
          { label: 'Essai', value: 'test-drive' },
          { label: 'Passage en agence', value: 'visit' },
          { label: 'Livraison / remise des clés', value: 'delivery' },
        ] },
        { name: 'status', label: 'Statut', type: 'select', required: true, defaultValue: 'confirmed', options: [
          { label: 'Confirmé', value: 'confirmed' },
          { label: 'Annulé', value: 'cancelled' },
          { label: 'Honoré', value: 'done' },
        ] },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'name', label: 'Nom', type: 'text', required: true },
        { name: 'email', label: 'E-mail', type: 'email', required: true },
        { name: 'phone', label: 'Téléphone', type: 'text', required: true },
      ],
    },
    { name: 'vehicle', label: 'Véhicule', type: 'relationship', relationTo: 'vehicles' },
    { name: 'request', label: 'Demande liée', type: 'relationship', relationTo: 'requests' },
    { name: 'reminderSent', label: 'Rappel envoyé', type: 'checkbox', defaultValue: false, admin: { readOnly: true } },
  ],
}
