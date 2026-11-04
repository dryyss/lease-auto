import type { GlobalConfig } from 'payload'

import { staff } from '@/access'

// ADM-06 : créneaux de rendez-vous proposés au public (PUB-14).
export const Agenda: GlobalConfig = {
  slug: 'agenda',
  label: 'Créneaux de rendez-vous',
  admin: { group: 'Clients' },
  access: { read: () => true, update: staff },
  fields: [
    { name: 'slotMinutes', label: 'Durée d’un créneau (minutes)', type: 'number', defaultValue: 45 },
    { name: 'minNoticeHours', label: 'Délai minimum de réservation (heures)', type: 'number', defaultValue: 4 },
    {
      name: 'weekly',
      label: 'Plages hebdomadaires',
      type: 'array',
      fields: [
        { type: 'row', fields: [
          { name: 'day', label: 'Jour', type: 'select', required: true, options: [
            { label: 'Lundi', value: '1' },
            { label: 'Mardi', value: '2' },
            { label: 'Mercredi', value: '3' },
            { label: 'Jeudi', value: '4' },
            { label: 'Vendredi', value: '5' },
            { label: 'Samedi', value: '6' },
            { label: 'Dimanche', value: '0' },
          ] },
          { name: 'from', label: 'De (HH:MM)', type: 'text', required: true },
          { name: 'to', label: 'À (HH:MM)', type: 'text', required: true },
        ] },
      ],
    },
    {
      name: 'closures',
      label: 'Fermetures exceptionnelles',
      type: 'array',
      fields: [
        { type: 'row', fields: [
          { name: 'from', label: 'Du', type: 'date', required: true },
          { name: 'to', label: 'Au', type: 'date', required: true },
          { name: 'reason', label: 'Motif', type: 'text' },
        ] },
      ],
    },
  ],
}
