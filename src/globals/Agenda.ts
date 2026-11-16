import type { GlobalConfig, TextFieldSingleValidation } from 'payload'

import { staff } from '@/access'

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/
const time: TextFieldSingleValidation = (v) => (typeof v === 'string' && HHMM.test(v)) || 'Heure au format HH:MM, ex. 09:30'

// ADM-06 : créneaux de rendez-vous proposés au public (PUB-14).
// Ce ne sont pas les horaires d'ouverture affichés sur le site (ceux-là sont dans Réglages → Horaires).
export const Agenda: GlobalConfig = {
  slug: 'agenda',
  label: 'Créneaux de rendez-vous',
  admin: {
    group: 'Clients',
    description:
      'Plages pendant lesquelles les clients peuvent réserver un essai ou un passage en ligne. Les horaires d’ouverture affichés sur le site se règlent dans Réglages.',
  },
  access: { read: () => true, update: staff },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'slotMinutes',
          label: 'Durée d’un rendez-vous (minutes)',
          type: 'number',
          defaultValue: 45,
          min: 15,
          admin: { width: '50%', description: 'Ex. 45 : créneaux à 10:00, 10:45, 11:30…' },
        },
        {
          name: 'minNoticeHours',
          label: 'Réservable au plus tôt dans (heures)',
          type: 'number',
          defaultValue: 4,
          min: 0,
          admin: { width: '50%', description: 'Ex. 4 : à 10 h, le premier créneau proposé est 14 h.' },
        },
      ],
    },
    {
      name: 'weekly',
      label: 'Plages de la semaine',
      labels: { singular: 'Plage', plural: 'Plages' },
      type: 'array',
      admin: {
        initCollapsed: true,
        description: 'Une ligne par plage. Pour une pause déjeuner, mettez deux plages le même jour (ex. 10:00–12:30 puis 14:00–18:30).',
        components: { RowLabel: '@/components/admin/AgendaLabels#WeeklyRowLabel' },
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'day',
              label: 'Jour',
              type: 'select',
              required: true,
              admin: { width: '40%' },
              options: [
                { label: 'Lundi', value: '1' },
                { label: 'Mardi', value: '2' },
                { label: 'Mercredi', value: '3' },
                { label: 'Jeudi', value: '4' },
                { label: 'Vendredi', value: '5' },
                { label: 'Samedi', value: '6' },
                { label: 'Dimanche', value: '0' },
              ],
            },
            { name: 'from', label: 'De', type: 'text', required: true, validate: time, admin: { width: '30%', placeholder: '10:00' } },
            { name: 'to', label: 'À', type: 'text', required: true, validate: time, admin: { width: '30%', placeholder: '12:30' } },
          ],
        },
      ],
    },
    {
      name: 'closures',
      label: 'Fermetures exceptionnelles',
      labels: { singular: 'Fermeture', plural: 'Fermetures' },
      type: 'array',
      admin: {
        initCollapsed: true,
        description: 'Congés, jours fériés : aucun rendez-vous proposé, et le site affiche « Fermé » ces jours-là.',
        components: { RowLabel: '@/components/admin/AgendaLabels#ClosureRowLabel' },
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'from', label: 'Du', type: 'date', required: true, admin: { width: '30%', date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' } } },
            { name: 'to', label: 'Au', type: 'date', required: true, admin: { width: '30%', date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' } } },
            { name: 'reason', label: 'Motif', type: 'text', admin: { width: '40%', placeholder: 'Ex. Congés de Noël' } },
          ],
        },
      ],
    },
  ],
}
