import type { CollectionConfig } from 'payload'

import { staff } from '@/access'
import { notifyAppointment, notifyAppointmentCancelled, notifyAppointmentMoved } from '@/lib/notifications'

// PUB-14 / ADM-06 : rendez-vous d'essai ou de passage en agence. Les créneaux sont définis dans le global « Agenda ».
export const Appointments: CollectionConfig = {
  slug: 'appointments',
  labels: { singular: 'Rendez-vous', plural: 'Rendez-vous' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['startsAt', 'status', 'kind', 'name', 'phone', 'vehicle'],
    group: 'Clients',
    listSearchableFields: ['name', 'email', 'phone'],
  },
  access: { read: staff, create: staff, update: staff, delete: staff },
  defaultSort: '-startsAt',
  hooks: {
    // Nouvel horaire : le rappel de la veille doit repartir.
    beforeChange: [
      ({ data, originalDoc, operation }) => {
        if (operation === 'update' && data.startsAt && originalDoc && new Date(data.startsAt).getTime() !== new Date(originalDoc.startsAt).getTime()) data.reminderSent = false
        return data
      },
    ],
    // E-mails au client : confirmation, annulation, nouvel horaire. `context.by` = 'client' quand c'est lui qui agit
    // (l'équipe est alors prévenue) ; `context.skipEmails` pour « Honoré » / « Pas venu » et les automatisations.
    afterChange: [
      async ({ doc, previousDoc, operation, req, context }) => {
        if (context.skipEmails) return doc
        const by = context.by === 'client' ? 'client' : 'agency'
        if (operation === 'create') await notifyAppointment(req.payload, doc)
        else if (previousDoc?.status === 'confirmed' && doc.status === 'cancelled') await notifyAppointmentCancelled(req.payload, doc, by)
        else if (doc.status === 'confirmed' && previousDoc && new Date(previousDoc.startsAt).getTime() !== new Date(doc.startsAt).getTime())
          await notifyAppointmentMoved(req.payload, doc, previousDoc.startsAt, by)
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
        { name: 'status', label: 'Statut', type: 'select', required: true, defaultValue: 'confirmed', admin: { components: { Cell: '@/components/admin/StatusCell#StatusCell' } }, options: [
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
