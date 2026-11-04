import type { GlobalConfig } from 'payload'

import { anyone, staff } from '@/access'

// PUB-17 / ADM-07 : page « L'agence » modifiable depuis l'administration.
export const Agency: GlobalConfig = {
  slug: 'agency',
  label: 'Page « L’agence »',
  admin: { group: 'Contenus' },
  access: { read: anyone, update: staff },
  fields: [
    { name: 'title', label: 'Titre', type: 'text', defaultValue: 'Lease Auto, votre spécialiste de l’occasion financée' },
    { name: 'intro', label: 'Accroche', type: 'textarea', defaultValue: 'Depuis notre agence d’Épinay-sur-Seine, nous sélectionnons des véhicules d’occasion contrôlés et trouvons le financement adapté à chaque profil.' },
    { name: 'content', label: 'Présentation', type: 'richText' },
    { name: 'photos', label: 'Photos de l’agence', type: 'upload', relationTo: 'media', hasMany: true },
    {
      name: 'mapEmbedUrl',
      label: 'Lien d’intégration Google Maps',
      type: 'text',
      admin: { description: 'Google Maps → Partager → Intégrer une carte → copier l’adresse contenue dans src="…".' },
    },
  ],
}
