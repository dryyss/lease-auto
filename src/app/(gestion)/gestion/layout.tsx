import type { ReactNode } from 'react'

import { Shell } from '@/components/gestion/Shell'
import { requireStaff } from '@/lib/gestion/session'

export const dynamic = 'force-dynamic'

export default async function GestionLayout({ children }: { children: ReactNode }) {
  const { payload, user } = await requireStaff()
  const dayStart = new Date()
  dayStart.setHours(0, 0, 0, 0)
  // Pastilles du menu : demandes à prendre, rendez-vous du jour.
  const [requests, appointments] = await Promise.all([
    payload.count({ collection: 'requests', where: { status: { equals: 'new' } }, user, overrideAccess: false }),
    payload.count({
      collection: 'appointments',
      where: { and: [{ status: { equals: 'confirmed' } }, { startsAt: { greater_than_equal: dayStart.toISOString() } }, { startsAt: { less_than: new Date(dayStart.getTime() + 86_400_000).toISOString() } }] },
      user,
      overrideAccess: false,
    }),
  ])
  return (
    <Shell user={{ name: user.name || user.email, role: user.role, email: user.email }} counts={{ requests: requests.totalDocs, appointments: appointments.totalDocs }}>
      {children}
    </Shell>
  )
}
