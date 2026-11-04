import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { publishedOrStaff, staff } from '@/access'
import { slugField } from '@/fields/slug'
import { computeMonthly, type Formula } from '@/lib/finance'

const formulas: { value: Formula; label: string }[] = [
  { value: 'loa', label: 'LOA' },
  { value: 'lld', label: 'LLD' },
  { value: 'credit', label: 'Crédit' },
]

// ADM-03 : mensualités calculées à partir des taux des réglages, sauf si saisies à la main.
const computeMonthlies: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (!data.price) return data
  const settings = await req.payload.findGlobal({ slug: 'settings', req, depth: 0 })
  const rates = settings.financing ?? {}

  data.monthlies = formulas.map(({ value }) => {
    const existing = (data.monthlies ?? []).find((m: { formula: Formula }) => m.formula === value)
    if (existing?.manual) return existing
    const conf = rates[value]
    if (!conf?.enabled || !conf.defaultMonths) return { formula: value, manual: false, amount: null }
    const deposit = (data.price * (conf.defaultDepositPercent ?? 0)) / 100
    const { monthly } = computeMonthly(value, {
      price: data.price,
      deposit,
      months: conf.defaultMonths,
      annualRate: conf.annualRate ?? 0,
      residualPercent: ('residualPercent' in conf ? conf.residualPercent : 0) ?? 0,
    })
    return { formula: value, manual: false, amount: monthly, months: conf.defaultMonths, deposit }
  })

  const amounts = data.monthlies.map((m: { amount?: number | null }) => m.amount).filter(Boolean)
  data.monthlyFrom = amounts.length ? Math.min(...amounts) : null
  return data
}

// PUB-07 : date de vente pour le retrait automatique des vendus (AUTO-06)
const trackSoldAt: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  if (data.status === 'sold' && originalDoc?.status !== 'sold') data.soldAt = new Date().toISOString()
  if (data.status !== 'sold') data.soldAt = null
  return data
}

export const Vehicles: CollectionConfig = {
  slug: 'vehicles',
  labels: { singular: 'Véhicule', plural: 'Véhicules' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'price', 'monthlyFrom', 'status', '_status', 'updatedAt'],
    group: 'Stock',
    listSearchableFields: ['title', 'model', 'reference'],
  },
  versions: { drafts: true, maxPerDoc: 20 },
  access: {
    read: publishedOrStaff,
    create: staff,
    update: staff,
    delete: staff,
  },
  hooks: { beforeChange: [trackSoldAt, computeMonthlies] },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'brand', label: 'Marque', type: 'relationship', relationTo: 'brands', required: true },
        { name: 'model', label: 'Modèle', type: 'relationship', relationTo: 'models', required: true },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'title', label: 'Titre de l’annonce', type: 'text', required: true, admin: { description: 'Ex. Peugeot 3008 1.2 PureTech 130 Allure' } },
        { name: 'reference', label: 'Référence interne', type: 'text', index: true },
      ],
    },
    slugField(['title', 'reference']),
    {
      name: 'status',
      label: 'Statut',
      type: 'select',
      required: true,
      defaultValue: 'available',
      index: true,
      // Nom d'enum explicite : sinon collision avec `_status` (brouillon/publié) ajouté par les versions.
      enumName: 'enum_vehicles_sale_status',
      admin: { position: 'sidebar' },
      options: [
        { label: 'Disponible', value: 'available' },
        { label: 'Réservé', value: 'reserved' },
        { label: 'Vendu', value: 'sold' },
      ],
    },
    { name: 'soldAt', label: 'Vendu le', type: 'date', admin: { position: 'sidebar', readOnly: true } },
    { name: 'featured', label: 'À la une (accueil)', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Photos',
          fields: [
            {
              name: 'gallery',
              label: 'Galerie',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              required: true,
              admin: { description: 'Glissez-déposez pour réordonner. La première photo est la photo principale.' },
            },
          ],
        },
        {
          label: 'Caractéristiques',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'year', label: 'Année', type: 'number', required: true, min: 1990, max: 2100 },
                { name: 'firstRegistration', label: 'Mise en circulation', type: 'date' },
                { name: 'mileage', label: 'Kilométrage', type: 'number', required: true, min: 0 },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'fuel',
                  label: 'Carburant',
                  type: 'select',
                  required: true,
                  index: true,
                  options: [
                    { label: 'Essence', value: 'essence' },
                    { label: 'Diesel', value: 'diesel' },
                    { label: 'Hybride', value: 'hybride' },
                    { label: 'Hybride rechargeable', value: 'hybride-rechargeable' },
                    { label: 'Électrique', value: 'electrique' },
                    { label: 'GPL', value: 'gpl' },
                  ],
                },
                {
                  name: 'gearbox',
                  label: 'Boîte',
                  type: 'select',
                  required: true,
                  options: [
                    { label: 'Manuelle', value: 'manuelle' },
                    { label: 'Automatique', value: 'automatique' },
                  ],
                },
                {
                  name: 'bodyType',
                  label: 'Type de véhicule',
                  type: 'select',
                  index: true,
                  options: [
                    { label: 'Citadine', value: 'citadine' },
                    { label: 'Berline', value: 'berline' },
                    { label: 'Break', value: 'break' },
                    { label: 'SUV', value: 'suv' },
                    { label: 'Monospace', value: 'monospace' },
                    { label: 'Coupé / cabriolet', value: 'coupe' },
                    { label: 'Utilitaire', value: 'utilitaire' },
                  ],
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'powerHp', label: 'Puissance (ch)', type: 'number' },
                { name: 'fiscalHp', label: 'Puissance fiscale (CV)', type: 'number' },
                { name: 'doors', label: 'Portes', type: 'number' },
                { name: 'seats', label: 'Places', type: 'number' },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'color', label: 'Couleur', type: 'text' },
                { name: 'co2', label: 'CO₂ (g/km)', type: 'number' },
                { name: 'critAir', label: 'Crit’Air', type: 'select', options: ['0', '1', '2', '3', '4', '5'] },
              ],
            },
            {
              name: 'equipment',
              label: 'Équipements',
              type: 'array',
              labels: { singular: 'Équipement', plural: 'Équipements' },
              fields: [{ name: 'label', label: 'Équipement', type: 'text', required: true }],
            },
            { name: 'warrantyMonths', label: 'Garantie (mois)', type: 'number', defaultValue: 12 },
            { name: 'description', label: 'Description', type: 'richText' },
          ],
        },
        {
          label: 'Prix et financement',
          fields: [
            { name: 'price', label: 'Prix total TTC (€)', type: 'number', required: true, min: 0 },
            {
              name: 'monthlyFrom',
              label: 'Mensualité « à partir de » (€)',
              type: 'number',
              index: true,
              admin: { readOnly: true, description: 'Calculée automatiquement : la plus basse des formules.' },
            },
            {
              name: 'monthlies',
              label: 'Mensualités par formule',
              type: 'array',
              maxRows: 3,
              admin: { description: 'Calculées avec les taux des Réglages. Cochez « saisie manuelle » pour imposer un montant.' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'formula', label: 'Formule', type: 'select', required: true, options: formulas },
                    { name: 'manual', label: 'Saisie manuelle', type: 'checkbox', defaultValue: false },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'amount', label: 'Mensualité (€)', type: 'number' },
                    { name: 'months', label: 'Durée (mois)', type: 'number' },
                    { name: 'deposit', label: 'Apport (€)', type: 'number' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
