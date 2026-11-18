'use client'

import { CarFront, Mail, Phone } from 'lucide-react'
import Link from 'next/link'
import { useRef } from 'react'

import { fmtDateTime, fmtTime, telHref } from '@/lib/gestion/labels'

import { AppointmentActions } from './AppointmentActions'
import { KindBadge, StatusBadge } from './badges'
import { Modal } from './dialog'
import type { Appt } from './types'

/** Carte compacte de la vue Semaine ; un clic ouvre le détail et les actions. */
export function AppointmentCard({ a }: { a: Appt }) {
  const ref = useRef<HTMLDialogElement>(null)
  const cancelled = a.status === 'cancelled'
  const toClose = a.status === 'confirmed' && a.past
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className={`block w-full rounded-xl border p-2.5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
          cancelled ? 'border-line bg-soft opacity-60' : toClose ? 'border-amber-300 bg-amber-50' : a.status === 'done' ? 'border-emerald-200 bg-emerald-50' : 'border-line bg-white'
        }`}
      >
        <span className="flex items-center justify-between gap-2">
          <span className={`text-sm font-black text-primary ${cancelled ? 'line-through' : ''}`}>{fmtTime(a.startsAt)}</span>
          <KindBadge kind={a.kind} />
        </span>
        <span className="mt-1 block truncate text-sm font-bold text-primary">{a.name}</span>
        {a.vehicle && <span className="mt-0.5 block truncate text-xs text-ink-2">{a.vehicle.title}</span>}
        {a.status !== 'confirmed' && (
          <span className="mt-1.5 block">
            <StatusBadge status={a.status} />
          </span>
        )}
        {toClose && <span className="mt-1.5 block text-xs font-bold text-amber-800">À clôturer</span>}
      </button>

      <Modal dialogRef={ref} title={a.name} description={`${fmtDateTime(a.startsAt)}`}>
        <div className="flex flex-wrap gap-2">
          <KindBadge kind={a.kind} />
          <StatusBadge status={a.status} />
        </div>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <dt>
              <Phone className="size-4 text-ink-3" aria-label="Téléphone" />
            </dt>
            <dd>
              <a href={telHref(a.phone)} className="font-semibold text-primary hover:text-accent">
                {a.phone}
              </a>
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt>
              <Mail className="size-4 text-ink-3" aria-label="E-mail" />
            </dt>
            <dd className="min-w-0 truncate">
              <Link href={`/gestion/clients/${encodeURIComponent(a.email.toLowerCase())}`} className="font-semibold text-primary hover:text-accent">
                {a.email}
              </Link>
            </dd>
          </div>
          {a.vehicle && (
            <div className="flex items-center gap-2">
              <dt>
                <CarFront className="size-4 text-ink-3" aria-label="Véhicule" />
              </dt>
              <dd>
                <Link href={`/gestion/vehicules/${a.vehicle.id}`} className="font-semibold text-primary hover:text-accent">
                  {a.vehicle.title}
                </Link>
              </dd>
            </div>
          )}
        </dl>
        <div className="mt-5 border-t border-line pt-4">
          <AppointmentActions a={a} />
        </div>
      </Modal>
    </>
  )
}
