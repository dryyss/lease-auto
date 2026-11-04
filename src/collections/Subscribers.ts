import { randomBytes } from 'crypto'
import type { CollectionConfig } from 'payload'

import { staff } from '@/access'

// PUB-15 / ADM-08 / MAIL-04-05 : abonnés newsletter et alertes véhicule.
export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  labels: { singular: 'Abonné', plural: 'Abonnés' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'newsletter', 'alertEnabled', 'createdAt'],
    group: 'Clients',
  },
  access: { read: staff, create: staff, update: staff, delete: staff },
  fields: [
    { name: 'email', label: 'E-mail', type: 'email', required: true, unique: true },
    { name: 'firstName', label: 'Prénom', type: 'text' },
    {
      type: 'row',
      fields: [
        { name: 'newsletter', label: 'Newsletter', type: 'checkbox', defaultValue: false },
        { name: 'alertEnabled', label: 'Alerte véhicule', type: 'checkbox', defaultValue: false },
      ],
    },
    {
      name: 'criteria',
      label: 'Critères de l’alerte',
      type: 'group',
      admin: { condition: (data) => Boolean(data?.alertEnabled) },
      fields: [
        { name: 'brands', label: 'Marques', type: 'relationship', relationTo: 'brands', hasMany: true },
        {
          type: 'row',
          fields: [
            { name: 'maxPrice', label: 'Prix max (€)', type: 'number' },
            { name: 'maxMonthly', label: 'Mensualité max (€)', type: 'number' },
            { name: 'maxMileage', label: 'Kilométrage max', type: 'number' },
          ],
        },
        { name: 'fuels', label: 'Carburants', type: 'select', hasMany: true, options: ['essence', 'diesel', 'hybride', 'hybride-rechargeable', 'electrique', 'gpl'] },
      ],
    },
    // CONF-02 : preuve du consentement
    { name: 'consentAt', label: 'Consentement donné le', type: 'date', required: true, admin: { readOnly: true } },
    {
      name: 'unsubscribeToken',
      type: 'text',
      index: true,
      admin: { hidden: true },
      hooks: { beforeChange: [({ value }) => value ?? randomBytes(24).toString('hex')] },
    },
  ],
}
