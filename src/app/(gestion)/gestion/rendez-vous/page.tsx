import { AlertTriangle, CalendarDays, ChevronLeft, ChevronRight, Settings } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import type { Where } from 'payload'

import { AppointmentCard } from '@/components/gestion/rendez-vous/AppointmentCard'
import { AppointmentRow } from '@/components/gestion/rendez-vous/AppointmentRow'
import { addDays, dayKey, dayLabel, dayStart, mondayOf, parisDayKey, parseDay, todayParis, type Day } from '@/components/gestion/rendez-vous/dates'
import { NewAppointment } from '@/components/gestion/rendez-vous/NewAppointment'
import { APPT_POPULATE, toAppt, type Appt } from '@/components/gestion/rendez-vous/types'
import { btn, Card, Empty, FilterPills, PageHeader } from '@/components/gestion/ui'
import { plural } from '@/lib/gestion/labels'
import { requireStaff } from '@/lib/gestion/session'

export const metadata: Metadata = { title: 'Rendez-vous' }

const FILTERS = ['a-venir', 'a-cloturer', 'historique'] as const
type Filter = (typeof FILTERS)[number]

export default async function RendezVousPage({ searchParams }: { searchParams: Promise<{ semaine?: string; vue?: string; filtre?: string }> }) {
  const sp = await searchParams
  const { payload, user } = await requireStaff()
  const nowMs = Date.now()
  const now = new Date(nowMs).toISOString()
  const filtre = FILTERS.find((f) => f === sp.filtre)
  const liste = sp.vue === 'liste' || !!filtre
  const today = todayParis()
  const base = { collection: 'appointments' as const, depth: 1, populate: APPT_POPULATE, user, overrideAccess: false }

  const [overdue, vehicles] = await Promise.all([
    payload.find({ ...base, where: { and: [{ status: { equals: 'confirmed' } }, { startsAt: { less_than: now } }] }, sort: 'startsAt', limit: 200 }),
    payload.find({ collection: 'vehicles', where: { status: { not_equals: 'sold' } }, select: { title: true }, sort: 'title', limit: 300, depth: 0, user, overrideAccess: false }),
  ])
  const toClose = overdue.docs.map((a) => toAppt(a, nowMs))

  const header = (
    <PageHeader
      title="Rendez-vous"
      subtitle="Essais, passages en agence et livraisons, à l’heure de Paris."
      actions={
        <>
          {/* Réglage dans l'ancienne interface (Payload) : vrai lien. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/admin/globals/agenda" className={btn.ghost}>
            <Settings className="size-4" aria-hidden /> Régler les créneaux
          </a>
          <NewAppointment today={dayKey(today)} vehicles={vehicles.docs.map((v) => ({ id: v.id, title: v.title }))} />
        </>
      }
    />
  )

  const viewPills = (
    <FilterPills
      items={[
        { href: '/gestion/rendez-vous', label: 'Semaine', active: !liste },
        { href: '/gestion/rendez-vous?vue=liste', label: 'Liste', active: liste },
      ]}
    />
  )

  const closeBlock =
    toClose.length > 0 && filtre !== 'a-cloturer' ? (
      <Card
        className="mb-6 border-amber-300"
        title={`À clôturer (${toClose.length})`}
        icon={AlertTriangle}
        padded={false}
        action={
          toClose.length > 5 ? (
            <Link href="/gestion/rendez-vous?vue=liste&filtre=a-cloturer" className="text-sm font-bold text-accent hover:underline">
              Tout voir
            </Link>
          ) : undefined
        }
      >
        <p className="px-5 pt-4 text-sm text-ink-2">Ces rendez-vous sont passés et toujours « confirmé ». Indiquez si le client est venu.</p>
        <ul className="divide-y divide-line">
          {toClose.slice(0, 5).map((a) => (
            <AppointmentRow key={a.id} a={a} />
          ))}
        </ul>
      </Card>
    ) : null

  if (liste) {
    const active: Filter = filtre ?? 'a-venir'
    const upWhere: Where = { and: [{ status: { equals: 'confirmed' } }, { startsAt: { greater_than_equal: now } }] }
    const histWhere: Where = { status: { in: ['done', 'cancelled'] } }
    const [upcoming, history, list] = await Promise.all([
      payload.count({ collection: 'appointments', where: upWhere, user, overrideAccess: false }),
      payload.count({ collection: 'appointments', where: histWhere, user, overrideAccess: false }),
      active === 'a-venir'
        ? payload.find({ ...base, where: upWhere, sort: 'startsAt', limit: 200 })
        : active === 'historique'
          ? payload.find({ ...base, where: histWhere, sort: '-startsAt', limit: 100 })
          : null,
    ])
    const rows: Appt[] = list ? list.docs.map((a) => toAppt(a, nowMs)) : toClose
    const empty = {
      'a-venir': { title: 'Aucun rendez-vous à venir.', text: 'Les réservations du site et celles que vous créez s’afficheront ici.' },
      'a-cloturer': { title: 'Rien à clôturer.', text: 'Tous les rendez-vous passés ont un statut à jour.' },
      historique: { title: 'Pas encore d’historique.', text: 'Les rendez-vous honorés ou annulés s’afficheront ici.' },
    }[active]

    return (
      <>
        {header}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          {viewPills}
          <FilterPills
            items={[
              { href: '/gestion/rendez-vous?vue=liste&filtre=a-venir', label: 'À venir', count: upcoming.totalDocs, active: active === 'a-venir' },
              { href: '/gestion/rendez-vous?vue=liste&filtre=a-cloturer', label: 'Passés à clôturer', count: overdue.totalDocs, active: active === 'a-cloturer' },
              { href: '/gestion/rendez-vous?vue=liste&filtre=historique', label: 'Historique', count: history.totalDocs, active: active === 'historique' },
            ]}
          />
        </div>
        {closeBlock}
        <Card padded={false}>
          {rows.length ? (
            <ul className="divide-y divide-line">
              {rows.map((a) => (
                <AppointmentRow key={a.id} a={a} />
              ))}
            </ul>
          ) : (
            <Empty icon={CalendarDays} title={empty.title} text={empty.text} />
          )}
        </Card>
        {active === 'historique' && history.totalDocs > rows.length && <p className="mt-3 text-sm text-ink-3">Seuls les 100 rendez-vous les plus récents sont affichés.</p>}
      </>
    )
  }

  // Vue Semaine : du lundi au dimanche de la semaine demandée.
  const monday = mondayOf(parseDay(sp.semaine) ?? today)
  const days: Day[] = Array.from({ length: 7 }, (_, i) => addDays(monday, i))
  const week = await payload.find({
    ...base,
    where: { and: [{ startsAt: { greater_than_equal: new Date(dayStart(monday)).toISOString() } }, { startsAt: { less_than: new Date(dayStart(addDays(monday, 7))).toISOString() } }] },
    sort: 'startsAt',
    limit: 300,
  })
  const byDay = new Map<string, Appt[]>()
  for (const doc of week.docs) {
    const a = toAppt(doc, nowMs)
    const key = parisDayKey(a.startsAt)
    byDay.set(key, [...(byDay.get(key) ?? []), a])
  }
  const todayKey = dayKey(today)
  const sunday = days[6]
  const range =
    monday.m === sunday.m
      ? `du ${monday.d} au ${dayLabel(sunday, { day: 'numeric', month: 'long', year: 'numeric' })}`
      : `du ${dayLabel(monday, { day: 'numeric', month: 'long' })} au ${dayLabel(sunday, { day: 'numeric', month: 'long', year: 'numeric' })}`
  const active = week.docs.filter((a) => a.status !== 'cancelled').length
  const href = (d: Day) => `/gestion/rendez-vous?semaine=${dayKey(d)}`

  return (
    <>
      {header}
      {closeBlock}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={href(addDays(monday, -7))} className={`${btn.ghost} px-2.5!`} aria-label="Semaine précédente">
            <ChevronLeft className="size-4" aria-hidden />
          </Link>
          <Link href={href(today)} className={btn.ghost}>
            Aujourd’hui
          </Link>
          <Link href={href(addDays(monday, 7))} className={`${btn.ghost} px-2.5!`} aria-label="Semaine suivante">
            <ChevronRight className="size-4" aria-hidden />
          </Link>
          <p className="ml-1 text-sm font-bold text-primary">
            Semaine {range} <span className="font-semibold text-ink-3">· {plural(active, 'rendez-vous', 'rendez-vous')}</span>
          </p>
        </div>
        {viewPills}
      </div>

      {/* Ordinateur : 7 colonnes. */}
      <div className="hidden gap-2 lg:grid lg:grid-cols-7">
        {days.map((d) => {
          const key = dayKey(d)
          const isToday = key === todayKey
          const list = byDay.get(key) ?? []
          return (
            <section key={key} aria-label={dayLabel(d, { weekday: 'long', day: 'numeric', month: 'long' })} className={`min-h-72 min-w-0 rounded-2xl border ${isToday ? 'border-accent bg-accent-soft/50' : 'border-line bg-white'}`}>
              <header className={`border-b px-3 py-2.5 ${isToday ? 'border-accent/30' : 'border-line'}`}>
                <p className={`text-xs font-bold uppercase ${isToday ? 'text-accent' : 'text-ink-3'}`}>{dayLabel(d, { weekday: 'short' })}</p>
                <p className="text-lg font-black text-primary">
                  {d.d} <span className="text-xs font-semibold text-ink-3">{dayLabel(d, { month: 'short' })}</span>
                </p>
              </header>
              {list.length ? (
                <ul className="space-y-2 p-2">
                  {list.map((a) => (
                    <li key={a.id}>
                      <AppointmentCard a={a} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="p-3 text-xs text-ink-3">Aucun rendez-vous.</p>
              )}
            </section>
          )
        })}
      </div>

      {/* Mobile et tablette : liste par jour. */}
      <div className="space-y-4 lg:hidden">
        {days.map((d) => {
          const key = dayKey(d)
          const isToday = key === todayKey
          const list = byDay.get(key) ?? []
          return (
            <section key={key} aria-label={dayLabel(d, { weekday: 'long', day: 'numeric', month: 'long' })}>
              <h2 className={`mb-2 flex items-center gap-2 text-sm font-black capitalize ${isToday ? 'text-accent' : 'text-primary'}`}>
                {dayLabel(d, { weekday: 'long', day: 'numeric', month: 'long' })}
                {isToday && <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] text-white normal-case">Aujourd’hui</span>}
              </h2>
              {list.length ? (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {list.map((a) => (
                    <li key={a.id}>
                      <AppointmentCard a={a} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-xl border border-dashed border-line px-3 py-2 text-xs text-ink-3">Aucun rendez-vous.</p>
              )}
            </section>
          )
        })}
      </div>
    </>
  )
}
