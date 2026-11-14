import type { GlobalConfig } from 'payload'

import { anyone, staff } from '@/access'

// PUB-01 / ADM-07 : textes de l'accueil modifiables sans compétence technique.
export const Homepage: GlobalConfig = {
  slug: 'homepage',
  label: 'Page d’accueil',
  admin: { group: 'Contenus' },
  access: { read: anyone, update: staff },
  fields: [
    {
      name: 'hero',
      label: 'Accroche',
      type: 'group',
      fields: [
        { name: 'title', label: 'Titre', type: 'text', required: true, defaultValue: 'Votre voiture d’occasion contrôlée, financée en LOA, LLD ou crédit' },
        { name: 'subtitle', label: 'Sous-titre', type: 'textarea', defaultValue: 'Garantie 12 mois, livraison partout en France, dossier étudié avec vous.' },
        { name: 'image', label: 'Image', type: 'upload', relationTo: 'media' },
        {
          name: 'badges',
          label: 'Badges',
          type: 'array',
          maxRows: 4,
          fields: [{ name: 'label', type: 'text', required: true }],
        },
      ],
    },
    {
      name: 'stats',
      label: 'Chiffres clés',
      type: 'array',
      maxRows: 4,
      fields: [
        { type: 'row', fields: [
          { name: 'value', label: 'Valeur', type: 'text', required: true },
          { name: 'label', label: 'Libellé', type: 'text', required: true },
        ] },
      ],
    },
    {
      name: 'steps',
      label: 'Étapes du parcours',
      type: 'array',
      maxRows: 5,
      fields: [
        { name: 'title', label: 'Titre', type: 'text', required: true },
        { name: 'text', label: 'Texte', type: 'textarea' },
      ],
    },
    { name: 'featuredFaqs', label: 'Questions affichées', type: 'relationship', relationTo: 'faqs', hasMany: true, maxRows: 6 },
  ],
}
