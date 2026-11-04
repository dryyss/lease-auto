import type { CollectionConfig } from 'payload'

import { admins, adminsField, isAdmin } from '@/access'
import { auth0Strategy } from '@/auth/auth0Strategy'
import { devStrategy } from '@/auth/devStrategy'

// ADM-10 : comptes administrateur et commercial
export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Utilisateur', plural: 'Utilisateurs' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'role'],
    group: 'Réglages',
    hidden: ({ user }) => !isAdmin(user),
  },
  // Pas de mot de passe dans Payload : la connexion passe par Auth0 (voir src/auth/auth0Strategy.ts).
  // Pour donner un accès : créer l'utilisateur ici avec son e-mail, il se connecte ensuite via Auth0.
  auth: {
    disableLocalStrategy: true,
    strategies: [auth0Strategy, devStrategy],
  },
  access: {
    create: admins,
    delete: admins,
    // Chacun peut lire et modifier son propre compte, l'admin tous les comptes.
    read: ({ req }) => (isAdmin(req.user) ? true : { id: { equals: req.user?.id } }),
    update: ({ req }) => (isAdmin(req.user) ? true : { id: { equals: req.user?.id } }),
  },
  fields: [
    {
      name: 'email',
      label: 'E-mail (identique au compte Auth0)',
      type: 'email',
      required: true,
      unique: true,
      index: true,
      hooks: { beforeValidate: [({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value)] },
    },
    { name: 'name', label: 'Nom', type: 'text', required: true },
    {
      name: 'disabled',
      label: 'Accès désactivé',
      type: 'checkbox',
      defaultValue: false,
      access: { update: adminsField, create: adminsField },
      admin: { position: 'sidebar' },
    },
    {
      name: 'role',
      label: 'Rôle',
      type: 'select',
      required: true,
      defaultValue: 'commercial',
      saveToJWT: true,
      access: { update: adminsField, create: adminsField },
      options: [
        { label: 'Administrateur', value: 'admin' },
        { label: 'Commercial', value: 'commercial' },
      ],
    },
  ],
}
