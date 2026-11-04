import type { Access, FieldAccess } from 'payload'

import type { User } from '@/payload-types'

// ROL-02 / ROL-03 : l'administrateur a tous les droits, le commercial gère véhicules et demandes.
export const isAdmin = (user: unknown): boolean => (user as User | null)?.role === 'admin'
export const isStaff = (user: unknown): boolean => Boolean(user)

export const admins: Access = ({ req }) => isAdmin(req.user)
export const staff: Access = ({ req }) => isStaff(req.user)
export const anyone: Access = () => true

export const adminsField: FieldAccess = ({ req }) => isAdmin(req.user)

/** Public : seulement les documents publiés. Équipe : tout. */
export const publishedOrStaff: Access = ({ req }) => {
  if (req.user) return true
  return { _status: { equals: 'published' } }
}
