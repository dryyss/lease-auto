'use client'

import { Check, FolderOpen, Phone, UserX, X } from 'lucide-react'
import Link from 'next/link'

import { setAppointmentStatus } from '@/app/(gestion)/gestion/rendez-vous/actions'
import { btn } from '@/components/gestion/ui'
import { fmtDateTime, telHref } from '@/lib/gestion/labels'

import { ConfirmAction } from './dialog'
import type { Appt } from './types'

const small = btn.small

/** Appeler, ouvrir la demande liée, et clôturer : « Honoré » / « Pas venu » une fois passé, « Annuler » avant. */
export function AppointmentActions({ a }: { a: Appt }) {
  const when = fmtDateTime(a.startsAt)
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href={telHref(a.phone)} className={`${btn.ghost} ${small}`}>
        <Phone className="size-3.5" aria-hidden /> Appeler
      </a>
      {a.request && (
        <Link href={`/gestion/demandes/${a.request.id}`} className={`${btn.ghost} ${small}`}>
          <FolderOpen className="size-3.5" aria-hidden /> Demande {a.request.reference}
        </Link>
      )}
      {a.status === 'confirmed' && a.past && (
        <>
          <ConfirmAction
            className={`${btn.dark} ${small}`}
            icon={<Check className="size-3.5" aria-hidden />}
            label="Honoré"
            title="Rendez-vous honoré ?"
            text={`${a.name} est bien venu le ${when}.`}
            cta="Oui, il est venu"
            run={() => setAppointmentStatus(a.id, 'done')}
          />
          <ConfirmAction
            className={`${btn.danger} ${small}`}
            icon={<UserX className="size-3.5" aria-hidden />}
            label="Pas venu"
            title="Le client n’est pas venu ?"
            text={`Le rendez-vous de ${a.name} du ${when} passera en « Annulé ».`}
            cta="Oui, pas venu"
            danger
            run={() => setAppointmentStatus(a.id, 'cancelled')}
          />
        </>
      )}
      {a.status === 'confirmed' && !a.past && (
        <ConfirmAction
          className={`${btn.danger} ${small}`}
          icon={<X className="size-3.5" aria-hidden />}
          label="Annuler"
          title="Annuler ce rendez-vous ?"
          text={`Le rendez-vous de ${a.name} du ${when} sera annulé et le créneau libéré. Le client n’est pas prévenu automatiquement : appelez-le.`}
          cta="Annuler le rendez-vous"
          danger
          run={() => setAppointmentStatus(a.id, 'cancelled')}
        />
      )}
    </div>
  )
}
