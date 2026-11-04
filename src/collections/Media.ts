import type { CollectionConfig } from 'payload'

import { anyone, staff } from '@/access'

// Images publiques : photos véhicules, agence, articles.
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Image', plural: 'Images' },
  admin: { group: 'Contenus' },
  access: { read: anyone, create: staff, update: staff, delete: staff },
  fields: [{ name: 'alt', label: 'Texte alternatif', type: 'text', required: true }],
  upload: {
    mimeTypes: ['image/*'],
    focalPoint: true,
    imageSizes: [
      { name: 'thumb', width: 480, height: 320, position: 'centre' },
      { name: 'card', width: 800, height: 533, position: 'centre' },
      { name: 'large', width: 1600 },
    ],
    formatOptions: { format: 'webp', options: { quality: 82 } },
  },
}
