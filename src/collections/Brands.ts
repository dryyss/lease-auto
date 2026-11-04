import type { CollectionConfig } from 'payload'

import { admins, anyone, staff } from '@/access'
import { slugField } from '@/fields/slug'

// SEO-02 : pages marque générées automatiquement, avec texte de présentation.
export const Brands: CollectionConfig = {
  slug: 'brands',
  labels: { singular: 'Marque', plural: 'Marques' },
  admin: { useAsTitle: 'name', group: 'Stock', defaultColumns: ['name', 'slug'] },
  access: { read: anyone, create: staff, update: staff, delete: admins },
  fields: [
    { name: 'name', label: 'Nom', type: 'text', required: true, unique: true },
    slugField(['name']),
    { name: 'logo', label: 'Logo', type: 'upload', relationTo: 'media' },
    { name: 'intro', label: 'Texte de présentation (page marque)', type: 'richText' },
  ],
}

export const Models: CollectionConfig = {
  slug: 'models',
  labels: { singular: 'Modèle', plural: 'Modèles' },
  admin: { useAsTitle: 'name', group: 'Stock', defaultColumns: ['name', 'brand', 'slug'] },
  access: { read: anyone, create: staff, update: staff, delete: admins },
  fields: [
    { name: 'brand', label: 'Marque', type: 'relationship', relationTo: 'brands', required: true, index: true },
    { name: 'name', label: 'Nom', type: 'text', required: true },
    slugField(['name'], { unique: false }),
    { name: 'intro', label: 'Texte de présentation (page modèle)', type: 'richText' },
  ],
  indexes: [{ fields: ['brand', 'slug'], unique: true }],
}
