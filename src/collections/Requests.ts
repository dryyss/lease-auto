import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { admins, staff } from '@/access'

const statuses = [
  { label: 'Nouvelle', value: 'new' },
  { label: 'En étude', value: 'review' },
  { label: 'Accord', value: 'approved' },
  { label: 'Refus', value: 'refused' },
  { label: 'Livrée', value: 'delivered' },
] as const

// ADM-04 : historique des changements de statut (sert aussi à MAIL-02).
const trackHistory: CollectionBeforeChangeHook = ({ data, originalDoc, req, operation }) => {
  const changed = operation === 'create' || data.status !== originalDoc?.status
  if (!changed) return data
  data.history = [
    ...(originalDoc?.history ?? []),
    { status: data.status, at: new Date().toISOString(), by: req.user?.id ?? null },
  ]
  if (data.status !== 'new') data.lastActionAt = new Date().toISOString()
  return data
}

// Demandes de financement, reprise, contact et rappel (PUB-03, PUB-12, PUB-13).
export const Requests: CollectionConfig = {
  slug: 'requests',
  labels: { singular: 'Demande', plural: 'Demandes' },
  admin: {
    useAsTitle: 'reference',
    defaultColumns: ['reference', 'type', 'lastName', 'vehicle', 'status', 'createdAt'],
    group: 'Clients',
    listSearchableFields: ['reference', 'lastName', 'email', 'phone'],
  },
  access: {
    // Le formulaire public crée la demande via une route serveur protégée (anti-spam), jamais en direct.
    create: staff,
    read: staff,
    update: staff,
    delete: admins,
  },
  hooks: {
    beforeChange: [
      trackHistory,
      ({ data, operation }) => {
        if (operation === 'create' && !data.reference) {
          const d = new Date()
          const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
          data.reference = `LA-${stamp}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'reference', label: 'Référence', type: 'text', unique: true, admin: { readOnly: true, position: 'sidebar' } },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      required: true,
      index: true,
      admin: { position: 'sidebar' },
      options: [
        { label: 'Financement', value: 'financing' },
        { label: 'Reprise', value: 'tradein' },
        { label: 'Contact', value: 'contact' },
        { label: 'Rappel', value: 'callback' },
      ],
    },
    {
      name: 'status',
      label: 'Statut',
      type: 'select',
      required: true,
      defaultValue: 'new',
      index: true,
      admin: { position: 'sidebar' },
      options: [...statuses],
    },
    { name: 'assignedTo', label: 'Suivi par', type: 'relationship', relationTo: 'users', admin: { position: 'sidebar' } },
    { name: 'lastActionAt', label: 'Dernière action équipe', type: 'date', admin: { position: 'sidebar', readOnly: true } },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Client',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'firstName', label: 'Prénom', type: 'text', required: true },
                { name: 'lastName', label: 'Nom', type: 'text', required: true },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'email', label: 'E-mail', type: 'email', required: true },
                { name: 'phone', label: 'Téléphone', type: 'text', required: true },
              ],
            },
            { name: 'postalCode', label: 'Code postal', type: 'text' },
            { name: 'message', label: 'Message', type: 'textarea' },
            { name: 'marketingConsent', label: 'Accepte les offres par e-mail', type: 'checkbox', defaultValue: false },
          ],
        },
        {
          label: 'Financement',
          admin: { condition: (data) => data?.type === 'financing' },
          fields: [
            { name: 'vehicle', label: 'Véhicule', type: 'relationship', relationTo: 'vehicles' },
            {
              type: 'row',
              fields: [
                { name: 'formula', label: 'Formule', type: 'select', options: [
                  { label: 'LOA', value: 'loa' },
                  { label: 'LLD', value: 'lld' },
                  { label: 'Crédit', value: 'credit' },
                ] },
                { name: 'months', label: 'Durée (mois)', type: 'number' },
                { name: 'deposit', label: 'Apport (€)', type: 'number' },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'profile', label: 'Situation', type: 'select', options: [
                  { label: 'Salarié CDI', value: 'cdi' },
                  { label: 'Salarié CDD / intérim', value: 'cdd' },
                  { label: 'Indépendant / VTC', value: 'independant' },
                  { label: 'Société', value: 'societe' },
                  { label: 'Retraité', value: 'retraite' },
                  { label: 'Autre', value: 'autre' },
                ] },
                { name: 'monthlyIncome', label: 'Revenus mensuels nets (€)', type: 'number' },
                { name: 'monthlyBudget', label: 'Budget mensuel (€)', type: 'number' },
              ],
            },
            {
              name: 'missingDocuments',
              label: 'Justificatifs manquants',
              type: 'checkbox',
              defaultValue: true,
              admin: { description: 'Utilisé par les relances automatiques (AUTO-01).' },
            },
            {
              name: 'remindersSent',
              label: 'Relances envoyées',
              type: 'number',
              defaultValue: 0,
              admin: { readOnly: true },
            },
          ],
        },
        {
          label: 'Reprise',
          admin: { condition: (data) => data?.type === 'tradein' },
          fields: [
            {
              name: 'tradeIn',
              type: 'group',
              label: false,
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'brand', label: 'Marque', type: 'text' },
                    { name: 'model', label: 'Modèle', type: 'text' },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'year', label: 'Année', type: 'number' },
                    { name: 'mileage', label: 'Kilométrage', type: 'number' },
                    { name: 'estimate', label: 'Estimation proposée (€)', type: 'number' },
                  ],
                },
                { name: 'photos', label: 'Photos', type: 'upload', relationTo: 'documents', hasMany: true },
              ],
            },
          ],
        },
        {
          label: 'Suivi interne',
          fields: [
            {
              name: 'notes',
              label: 'Notes internes',
              type: 'array',
              labels: { singular: 'Note', plural: 'Notes' },
              fields: [
                { name: 'text', label: 'Note', type: 'textarea', required: true },
                {
                  name: 'author',
                  type: 'relationship',
                  relationTo: 'users',
                  admin: { readOnly: true },
                  hooks: { beforeChange: [({ value, req }) => value ?? req.user?.id] },
                },
                {
                  name: 'at',
                  type: 'date',
                  admin: { readOnly: true },
                  hooks: { beforeChange: [({ value }) => value ?? new Date().toISOString()] },
                },
              ],
            },
            {
              name: 'history',
              label: 'Historique des statuts',
              type: 'array',
              admin: { readOnly: true },
              fields: [
                { name: 'status', type: 'select', options: [...statuses] },
                { name: 'at', type: 'date' },
                { name: 'by', type: 'relationship', relationTo: 'users' },
              ],
            },
          ],
        },
        {
          label: 'Justificatifs',
          fields: [
            {
              name: 'documents',
              label: 'Justificatifs',
              type: 'join',
              collection: 'documents',
              on: 'request',
            },
          ],
        },
      ],
    },
  ],
}
