import { Lock, Users } from 'lucide-react'
import type { Metadata } from 'next'

import { AddMember, MemberActions } from '@/components/gestion/equipe/TeamControls'
import { Badge, Card, Empty, PageHeader } from '@/components/gestion/ui'
import { fmtDate, plural } from '@/lib/gestion/labels'
import { isAdminUser, requireStaff } from '@/lib/gestion/session'

export const metadata: Metadata = { title: 'Équipe' }

export default async function EquipePage() {
  const { payload, user } = await requireStaff()
  if (!isAdminUser(user)) {
    return (
      <>
        <PageHeader title="Équipe" />
        <Card>
          <Empty icon={Lock} title="Réservé aux administrateurs." text="Demandez à un administrateur de modifier les accès de l’équipe." />
        </Card>
      </>
    )
  }

  const [members, open] = await Promise.all([
    payload.find({ collection: 'users', sort: 'name', limit: 200, depth: 0, user, overrideAccess: false }),
    payload.find({
      collection: 'requests',
      where: { and: [{ status: { in: ['new', 'review', 'approved'] } }, { assignedTo: { exists: true } }] },
      limit: 5000,
      depth: 0,
      select: { assignedTo: true },
      user,
      overrideAccess: false,
    }),
  ])
  const load = new Map<number, number>()
  for (const r of open.docs) {
    const id = typeof r.assignedTo === 'object' ? r.assignedTo?.id : r.assignedTo
    if (id != null) load.set(id, (load.get(id) ?? 0) + 1)
  }

  return (
    <>
      <PageHeader title="Équipe" subtitle="Qui peut se connecter à la gestion, et avec quels droits." actions={<AddMember />} />

      <Card padded={false}>
        {members.docs.length ? (
          <ul className="divide-y divide-line">
            {members.docs.map((m) => {
              const self = m.id === user.id
              const initials =
                (m.name || m.email)
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((w) => w[0]?.toUpperCase())
                  .join('') || '?'
              const count = load.get(m.id) ?? 0
              return (
                <li key={m.id} className={`flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center ${m.disabled ? 'bg-soft/60' : ''}`}>
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span aria-hidden className={`flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-black text-white ${m.disabled ? 'bg-ink-3' : 'bg-primary'}`}>
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 font-bold text-primary">
                        {m.name}
                        {self && <span className="text-xs font-semibold text-ink-3">(vous)</span>}
                      </p>
                      <p className="truncate text-sm text-ink-2">{m.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:w-80">
                    <Badge className={m.role === 'admin' ? 'bg-primary text-white' : 'bg-soft text-ink-2'}>{m.role === 'admin' ? 'Administrateur' : 'Commercial'}</Badge>
                    <Badge className={m.disabled ? 'bg-line text-ink-2' : 'bg-emerald-100 text-emerald-800'}>{m.disabled ? 'Accès coupé' : 'Accès actif'}</Badge>
                    <span className="text-xs text-ink-3">{count ? `${plural(count, 'dossier')} en cours` : 'Aucun dossier en cours'}</span>
                  </div>
                  <div className="lg:w-auto">
                    <MemberActions id={m.id} name={m.name} role={m.role} disabled={!!m.disabled} self={self} />
                    <p className="mt-1 text-xs text-ink-3">Ajouté le {fmtDate(m.createdAt)}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <Empty icon={Users} title="Aucun membre." />
        )}
      </Card>

      <p className="mt-4 text-sm text-ink-2">
        Pour donner un accès, ajoutez le membre avec son adresse e-mail : il se connecte ensuite avec cette adresse depuis la page de connexion. Un accès coupé ne peut plus se connecter, mais ses dossiers restent
        attribués.
      </p>
    </>
  )
}
