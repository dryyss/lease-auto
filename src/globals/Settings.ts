import type { Field, GlobalConfig } from 'payload'

import { admins, anyone, isAdmin } from '@/access'

const formulaRates = (name: 'loa' | 'lld' | 'credit', label: string, withResidual: boolean): Field => ({
  name,
  label,
  type: 'group',
  fields: [
    { name: 'enabled', label: 'Formule proposée', type: 'checkbox', defaultValue: true },
    {
      type: 'row',
      fields: [
        { name: 'annualRate', label: 'Taux débiteur annuel (%)', type: 'number', min: 0 },
        { name: 'taeg', label: 'TAEG de l’exemple représentatif (%)', type: 'number', min: 0 },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'minMonths', label: 'Durée min (mois)', type: 'number', defaultValue: 12 },
        { name: 'maxMonths', label: 'Durée max (mois)', type: 'number', defaultValue: name === 'credit' ? 72 : 84 },
        { name: 'defaultMonths', label: 'Durée affichée « à partir de »', type: 'number', defaultValue: 48 },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'defaultDepositPercent', label: 'Apport par défaut (% du prix)', type: 'number', defaultValue: 0 },
        ...(withResidual
          ? [{ name: 'residualPercent', label: 'Valeur résiduelle (% du prix)', type: 'number' as const, defaultValue: 35 }]
          : []),
      ],
    },
    {
      name: 'representativeExample',
      label: 'Exemple représentatif (CONF-01)',
      type: 'textarea',
      admin: { description: 'Texte légal affiché sous chaque offre chiffrée.' },
    },
  ],
})

// ADM-09 : coordonnées, horaires, taux, mentions légales, réseaux sociaux.
export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Réglages',
  admin: { group: 'Réglages', hidden: ({ user }) => !isAdmin(user) },
  access: { read: anyone, update: admins },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Entreprise',
          fields: [
            {
              name: 'company',
              type: 'group',
              label: false,
              fields: [
                { type: 'row', fields: [
                  { name: 'name', label: 'Raison sociale', type: 'text', defaultValue: 'Lease Auto' },
                  { name: 'legalForm', label: 'Forme et capital', type: 'text' },
                ] },
                { type: 'row', fields: [
                  { name: 'siren', label: 'SIREN', type: 'text' },
                  { name: 'rcs', label: 'RCS', type: 'text' },
                  { name: 'orias', label: 'N° ORIAS', type: 'text' },
                ] },
                { name: 'address', label: 'Adresse', type: 'text', defaultValue: '42 boulevard Foch' },
                { type: 'row', fields: [
                  { name: 'postalCode', label: 'Code postal', type: 'text', defaultValue: '93800' },
                  { name: 'city', label: 'Ville', type: 'text', defaultValue: 'Épinay-sur-Seine' },
                ] },
                { type: 'row', fields: [
                  { name: 'phone', label: 'Téléphone', type: 'text', defaultValue: '01 84 21 83 93' },
                  { name: 'whatsapp', label: 'WhatsApp (format international, ex. 33612345678)', type: 'text' },
                  { name: 'email', label: 'E-mail de contact', type: 'email', defaultValue: 'contact@lease-auto.fr' },
                ] },
                { name: 'notificationEmails', label: 'E-mails qui reçoivent les notifications (MAIL-03)', type: 'text', hasMany: true },
                { name: 'mapsUrl', label: 'Lien Google Maps', type: 'text' },
                { name: 'googleReviewUrl', label: 'Lien « laisser un avis » Google (AUTO-04)', type: 'text' },
              ],
            },
            {
              name: 'openingHours',
              label: 'Horaires',
              type: 'array',
              fields: [
                { type: 'row', fields: [
                  { name: 'days', label: 'Jours', type: 'text', required: true, admin: { description: 'Ex. Lundi – vendredi' } },
                  { name: 'hours', label: 'Horaires', type: 'text', required: true, admin: { description: 'Ex. 9h30 – 19h' } },
                ] },
              ],
            },
            {
              name: 'social',
              label: 'Réseaux sociaux',
              type: 'group',
              fields: [
                { type: 'row', fields: [
                  { name: 'facebook', type: 'text' },
                  { name: 'instagram', type: 'text' },
                  { name: 'tiktok', type: 'text' },
                ] },
              ],
            },
          ],
        },
        {
          label: 'Financement',
          fields: [
            {
              name: 'financing',
              type: 'group',
              label: false,
              fields: [
                formulaRates('loa', 'LOA', true),
                formulaRates('lld', 'LLD', true),
                formulaRates('credit', 'Crédit', false),
                {
                  name: 'legalNotice',
                  label: 'Mention obligatoire',
                  type: 'text',
                  defaultValue: 'Un crédit vous engage et doit être remboursé. Vérifiez vos capacités de remboursement avant de vous engager.',
                },
              ],
            },
          ],
        },
        {
          label: 'Délais et automatisations',
          fields: [
            {
              name: 'retention',
              type: 'group',
              label: false,
              fields: [
                { type: 'row', fields: [
                  { name: 'soldVisibleDays', label: 'Jours d’affichage des vendus (PUB-07)', type: 'number', defaultValue: 15 },
                  { name: 'documentsDays', label: 'Conservation des justificatifs (jours)', type: 'number', defaultValue: 90 },
                ] },
                { type: 'row', fields: [
                  { name: 'internalReminderHours', label: 'Relance interne après (heures)', type: 'number', defaultValue: 24 },
                  { name: 'reviewRequestDays', label: 'Demande d’avis après livraison (jours)', type: 'number', defaultValue: 5 },
                ] },
              ],
            },
          ],
        },
        {
          label: 'Mentions légales',
          fields: [
            { name: 'legalNotice', label: 'Mentions légales', type: 'richText' },
            { name: 'privacyPolicy', label: 'Politique de confidentialité', type: 'richText' },
            { name: 'terms', label: 'Conditions générales', type: 'richText' },
          ],
        },
      ],
    },
  ],
}
