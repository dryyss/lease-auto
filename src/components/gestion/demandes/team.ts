import 'server-only'

import type { Payload } from 'payload'

export type Member = { id: number; name: string; email: string; active: boolean }

/**
 * Noms de l'équipe, pour afficher le conseiller et l'auteur des notes.
 * Un commercial ne peut lire que son propre compte : on lit ici sans contrôle d'accès, et seulement nom et e-mail.
 */
export async function loadTeam(payload: Payload): Promise<Member[]> {
  const { docs } = await payload.find({
    collection: 'users',
    limit: 200,
    depth: 0,
    sort: 'name',
    overrideAccess: true,
    select: { name: true, email: true, disabled: true },
  })
  return docs.map((u) => ({ id: u.id, name: u.name || u.email, email: u.email, active: !u.disabled }))
}
