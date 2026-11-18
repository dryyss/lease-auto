import Link from 'next/link'

import { fmtDate, fmtTime } from '@/lib/gestion/labels'

import { AppointmentActions } from './AppointmentActions'
import { KindBadge, StatusBadge } from './badges'
import type { Appt } from './types'

/** Ligne de la vue Liste et du bloc « À clôturer ». */
export function AppointmentRow({ a }: { a: Appt }) {
  return (
    <li className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center">
      <div className="w-32 shrink-0">
        <p className="text-sm font-black text-primary">{fmtTime(a.startsAt)}</p>
        <p className="text-xs text-ink-3">{fmtDate(a.startsAt)}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2">
          <Link href={`/gestion/clients/${encodeURIComponent(a.email.toLowerCase())}`} className="font-bold text-primary hover:text-accent">
            {a.name}
          </Link>
          <KindBadge kind={a.kind} />
          <StatusBadge status={a.status} />
        </p>
        <p className="mt-0.5 truncate text-sm text-ink-2">
          {a.phone}
          {a.vehicle && (
            <>
              {' · '}
              <Link href={`/gestion/vehicules/${a.vehicle.id}`} className="hover:text-accent">
                {a.vehicle.title}
              </Link>
            </>
          )}
        </p>
      </div>
      <AppointmentActions a={a} />
    </li>
  )
}
