import type { CollectionConfig } from 'payload'

import { anyone, publishedOrStaff, staff } from '@/access'
import { slugField } from '@/fields/slug'

// PUB-16 : avis Google réels (prénom, note, date), mis en avant depuis l'administration.
export const Reviews: CollectionConfig = {
  slug: 'reviews',
  labels: { singular: 'Avis client', plural: 'Avis clients' },
  admin: { useAsTitle: 'firstName', defaultColumns: ['firstName', 'rating', 'date', 'featured'], group: 'Contenus' },
  access: { read: anyone, create: staff, update: staff, delete: staff },
  defaultSort: '-date',
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'firstName', label: 'Prénom', type: 'text', required: true },
        { name: 'rating', label: 'Note', type: 'number', required: true, min: 1, max: 5 },
        { name: 'date', label: 'Date', type: 'date', required: true },
      ],
    },
    { name: 'text', label: 'Avis', type: 'textarea', required: true },
    { name: 'source', label: 'Source', type: 'select', defaultValue: 'google', options: [{ label: 'Google', value: 'google' }] },
    { name: 'sourceId', type: 'text', unique: true, admin: { hidden: true } },
    { name: 'featured', label: 'Mis en avant', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
  ],
}

// PUB-18 : FAQ gérée depuis l'administration, regroupée par thème (aussi utilisée sur les pages formules).
export const Faqs: CollectionConfig = {
  slug: 'faqs',
  labels: { singular: 'Question', plural: 'FAQ' },
  admin: { useAsTitle: 'question', defaultColumns: ['question', 'category', 'order'], group: 'Contenus' },
  access: { read: anyone, create: staff, update: staff, delete: staff },
  defaultSort: 'order',
  fields: [
    { name: 'question', label: 'Question', type: 'text', required: true },
    { name: 'answer', label: 'Réponse', type: 'richText', required: true },
    {
      type: 'row',
      fields: [
        { name: 'category', label: 'Thème', type: 'select', required: true, options: [
          { label: 'Général', value: 'general' },
          { label: 'LOA', value: 'loa' },
          { label: 'LLD', value: 'lld' },
          { label: 'Crédit', value: 'credit' },
          { label: 'Dossier et justificatifs', value: 'dossier' },
          { label: 'Livraison et garantie', value: 'livraison' },
        ] },
        { name: 'order', label: 'Ordre', type: 'number', defaultValue: 0 },
      ],
    },
  ],
}

// PUB-18 : guides et articles de conseil.
export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: { singular: 'Article', plural: 'Articles' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'publishedAt', '_status'], group: 'Contenus' },
  versions: { drafts: true },
  access: { read: publishedOrStaff, create: staff, update: staff, delete: staff },
  defaultSort: '-publishedAt',
  fields: [
    { name: 'title', label: 'Titre', type: 'text', required: true },
    slugField(['title']),
    { name: 'publishedAt', label: 'Publié le', type: 'date', admin: { position: 'sidebar' } },
    { name: 'cover', label: 'Image de couverture', type: 'upload', relationTo: 'media' },
    { name: 'excerpt', label: 'Résumé', type: 'textarea' },
    { name: 'content', label: 'Contenu', type: 'richText', required: true },
  ],
}

// SEO-03 : pages locales (Épinay-sur-Seine, Saint-Denis, Paris nord, 93, 95).
export const LocalPages: CollectionConfig = {
  slug: 'local-pages',
  labels: { singular: 'Page locale', plural: 'Pages locales' },
  admin: { useAsTitle: 'city', defaultColumns: ['city', 'slug', '_status'], group: 'Contenus' },
  versions: { drafts: true },
  access: { read: publishedOrStaff, create: staff, update: staff, delete: staff },
  fields: [
    { name: 'city', label: 'Ville ou zone', type: 'text', required: true },
    slugField(['city']),
    { name: 'headline', label: 'Titre de la page', type: 'text', required: true },
    { name: 'content', label: 'Texte', type: 'richText', required: true },
    { name: 'distanceNote', label: 'Accès depuis l’agence', type: 'text', admin: { description: 'Ex. À 10 min de Saint-Denis par l’A86.' } },
  ],
}
