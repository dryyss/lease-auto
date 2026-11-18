'use client'

import { CalendarCheck, CalendarOff, CalendarRange, Copy, Plus, Settings2, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { saveAgenda } from '@/app/(gestion)/gestion/creneaux/actions'
import { ErrorBanner, errAria, F, Note, SaveBar, Toast, toNum, useLeaveWarning, useToast } from '@/components/gestion/reglages/form'
import { Badge, btn, Card, field, label as labelCls } from '@/components/gestion/ui'
import type { DaySlots } from '@/lib/agenda'

import { DAYS, fid, isTime, minutes, validateAgenda, type AgendaInput, type Closure, type Day, type FieldErrors } from './shared'

const pad = (n: number) => String(n).padStart(2, '0')
const hhmm = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
const todayParis = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const fmtDay = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

export function AgendaForm({ initial, preview }: { initial: AgendaInput; preview: DaySlots[] | null }) {
  const router = useRouter()
  const [v, setV] = useState<AgendaInput>(initial)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [globalError, setGlobalError] = useState('')
  const [pending, setPending] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [toast, setToast] = useToast()
  useLeaveWarning(dirty)

  /** Modifie l'état ; les erreurs touchées sont effacées. */
  function up(fn: (x: AgendaInput) => AgendaInput, ...keys: string[]) {
    setV(fn)
    setDirty(true)
    if (keys.some((k) => errors[k])) setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !keys.includes(k))))
  }

  function showErrors(fields: FieldErrors, message: string) {
    setErrors(fields)
    setGlobalError(message)
    const first = Object.keys(fields)[0]
    const el = first ? document.getElementById(fid(first)) : null
    if (el) requestAnimationFrame(() => el.focus())
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const local = validateAgenda(v)
    if (Object.keys(local).length) return showErrors(local, 'Certaines saisies sont à corriger (signalées en rouge).')
    setPending(true)
    setGlobalError('')
    const r = await saveAgenda(v).catch(() => ({ ok: false as const, error: 'La connexion a été interrompue. Vos saisies sont toujours là : réessayez.', fields: undefined }))
    setPending(false)
    if (!r.ok) return showErrors(r.fields ?? {}, r.error)
    setErrors({})
    setDirty(false)
    setToast('Créneaux enregistrés')
    router.refresh()
  }

  const slot = v.slotMinutes && v.slotMinutes >= 15 ? v.slotMinutes : null
  const today = todayParis()

  /** Nouvelle plage : après la dernière du jour, sinon 10:00–18:00. */
  const addRange = (day: Day) => {
    const same = v.weekly.filter((w) => w.day === day && isTime(w.to))
    const last = same.length ? Math.max(...same.map((w) => minutes(w.to))) : null
    const from = last == null ? 600 : Math.min(last + 60, 22 * 60)
    const to = last == null ? 1080 : Math.min(from + 180, 23 * 60 + 59)
    up((x) => ({ ...x, weekly: [...x.weekly, { day, from: hhmm(from), to: hhmm(to) }] }))
  }
  /** Remplace les plages d'un jour par celles d'un autre. */
  const copyDay = (from: Day, to: Day) =>
    up(
      (x) => ({ ...x, weekly: [...x.weekly.filter((w) => w.day !== to), ...x.weekly.filter((w) => w.day === from).map(({ from: f, to: t }) => ({ day: to, from: f, to: t }))] }),
      ...v.weekly.map((_, i) => `weekly.${i}`),
    )
  const setRange = (i: number, k: 'from' | 'to', val: string) => up((x) => ({ ...x, weekly: x.weekly.map((w, j) => (j === i ? { ...w, [k]: val } : w)) }), `weekly.${i}`)
  const removeRange = (i: number) => up((x) => ({ ...x, weekly: x.weekly.filter((_, j) => j !== i) }), ...v.weekly.map((_, j) => `weekly.${j}`))

  const setClosure = (i: number, k: keyof Closure, val: string) => up((x) => ({ ...x, closures: x.closures.map((c, j) => (j === i ? { ...c, [k]: val } : c)) }), `closures.${i}.${k}`)
  const past = v.closures.filter((c) => c.to && c.to < today).length

  const weeklyErrors = Object.keys(errors).some((k) => k.startsWith('weekly.'))
  const totalSlots = slot ? v.weekly.reduce((n, w) => (isTime(w.from) && isTime(w.to) ? n + Math.max(0, Math.floor((minutes(w.to) - minutes(w.from)) / slot)) : n), 0) : 0

  return (
    <form onSubmit={onSubmit} noValidate>
      <SaveBar dirty={dirty} pending={pending} />
      <ErrorBanner message={globalError} onClose={() => setGlobalError('')} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Card title="Durée et délai" icon={Settings2}>
            <div className="grid gap-4 sm:grid-cols-2">
              <F id={fid('slotMinutes')} text="Durée d’un rendez-vous (minutes)" error={errors.slotMinutes} hint={slot ? `Ex. une plage 10:00–12:00 donne ${Math.floor(120 / slot)} créneau${Math.floor(120 / slot) > 1 ? 'x' : ''} : ${slotExample(slot)}.` : 'Au moins 15 minutes.'}>
                <input
                  {...errAria(fid('slotMinutes'), errors.slotMinutes)}
                  type="number"
                  inputMode="numeric"
                  min={15}
                  step={5}
                  className={field}
                  value={v.slotMinutes ?? ''}
                  onChange={(e) => up((x) => ({ ...x, slotMinutes: toNum(e.target.value) }), 'slotMinutes')}
                />
              </F>
              <F
                id={fid('minNoticeHours')}
                text="Réservable au plus tôt dans (heures)"
                error={errors.minNoticeHours}
                hint={v.minNoticeHours != null ? `Ex. ${v.minNoticeHours} : à 10 h, le premier créneau proposé est à ${hhmm(((10 + v.minNoticeHours) % 24) * 60).replace(':', ' h ').replace(' h 00', ' h')}${10 + v.minNoticeHours >= 24 ? ' (un autre jour)' : ''}.` : undefined}
              >
                <input
                  {...errAria(fid('minNoticeHours'), errors.minNoticeHours)}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  className={field}
                  value={v.minNoticeHours ?? ''}
                  onChange={(e) => up((x) => ({ ...x, minNoticeHours: toNum(e.target.value) }), 'minNoticeHours')}
                />
              </F>
            </div>
          </Card>

          <Card title="Plages de la semaine" icon={CalendarRange}>
            <p className="mb-4 text-sm text-ink-2">
              Pour une pause déjeuner, mettez deux plages le même jour (ex. 10:00–12:30 puis 14:00–18:30). Un jour sans plage : aucun rendez-vous proposé. Ce ne sont pas les horaires d’ouverture affichés sur le
              site : ceux-là se règlent dans{' '}
              <Link href="/gestion/reglages#horaires" className="font-bold text-accent hover:underline">
                Réglages
              </Link>
              .
            </p>
            {weeklyErrors && <p className="mb-3 text-sm font-semibold text-accent">Certaines plages sont à corriger.</p>}
            <div className="overflow-hidden rounded-xl border border-line">
              {/* Tableau sur ordinateur, liste empilée sur téléphone. */}
              <table className="block w-full text-sm sm:table">
                <caption className="sr-only">Plages de rendez-vous par jour</caption>
                <thead className="hidden bg-soft text-left text-xs text-ink-2 sm:table-header-group">
                  <tr>
                    <th scope="col" className="w-28 px-3 py-2 font-bold">
                      Jour
                    </th>
                    <th scope="col" className="px-3 py-2 font-bold">
                      Plages
                    </th>
                  </tr>
                </thead>
                <tbody className="block divide-y divide-line sm:table-row-group">
                  {DAYS.map((d, di) => {
                    const ranges = v.weekly.map((w, i) => ({ ...w, i })).filter((w) => w.day === d.value)
                    const prev = di > 0 ? DAYS[di - 1] : null
                    const prevHas = prev && v.weekly.some((w) => w.day === prev.value)
                    const count = slot ? ranges.reduce((n, w) => (isTime(w.from) && isTime(w.to) ? n + Math.max(0, Math.floor((minutes(w.to) - minutes(w.from)) / slot)) : n), 0) : 0
                    return (
                      <tr key={d.value} className="block align-top sm:table-row">
                        <th scope="row" className="block px-3 pt-3 text-left sm:table-cell sm:pb-3">
                          <span className="block font-bold text-primary">{d.label}</span>
                          <span className="text-xs font-normal text-ink-3">{ranges.length ? `${count} créneau${count > 1 ? 'x' : ''}` : 'Fermé'}</span>
                        </th>
                        <td className="block px-3 py-3 sm:table-cell">
                          <ul className="space-y-2">
                            {ranges.map((w) => {
                              const key = `weekly.${w.i}`
                              const short = slot && isTime(w.from) && isTime(w.to) && minutes(w.to) > minutes(w.from) && minutes(w.to) - minutes(w.from) < slot
                              return (
                                <li key={w.i}>
                                  <div className="flex flex-wrap items-center gap-2" role="group" aria-label={`${d.label}, plage ${w.from}–${w.to}`}>
                                    <label htmlFor={`${fid(key)}`} className="sr-only">
                                      {d.label} : début
                                    </label>
                                    <input
                                      {...errAria(fid(key), errors[key])}
                                      type="time"
                                      step={300}
                                      required
                                      className={`${field} w-32`}
                                      value={w.from}
                                      onChange={(e) => setRange(w.i, 'from', e.target.value)}
                                    />
                                    <span aria-hidden className="text-ink-3">
                                      –
                                    </span>
                                    <label htmlFor={`${fid(key)}-to`} className="sr-only">
                                      {d.label} : fin
                                    </label>
                                    <input
                                      id={`${fid(key)}-to`}
                                      aria-invalid={errors[key] ? true : undefined}
                                      aria-describedby={errors[key] ? `${fid(key)}-error` : undefined}
                                      type="time"
                                      step={300}
                                      required
                                      className={`${field} w-32`}
                                      value={w.to}
                                      onChange={(e) => setRange(w.i, 'to', e.target.value)}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeRange(w.i)}
                                      className="flex size-10 items-center justify-center rounded-xl border border-line text-accent hover:bg-accent-soft"
                                      aria-label={`Retirer la plage ${w.from}–${w.to} du ${d.label.toLowerCase()}`}
                                    >
                                      <X className="size-4" aria-hidden />
                                    </button>
                                  </div>
                                  {errors[key] ? (
                                    <p id={`${fid(key)}-error`} className="mt-1 text-xs font-semibold text-accent">
                                      {errors[key]}
                                    </p>
                                  ) : (
                                    short && <p className="mt-1 text-xs font-semibold text-amber-700">Plage plus courte qu’un rendez-vous : aucun créneau proposé.</p>
                                  )}
                                </li>
                              )
                            })}
                          </ul>
                          <div className={`flex flex-wrap gap-2 ${ranges.length ? 'mt-2' : ''}`}>
                            <button type="button" className={`${btn.ghost} ${btn.small}`} onClick={() => addRange(d.value)}>
                              <Plus className="size-3.5" aria-hidden /> Ajouter une plage
                            </button>
                            {prev && prevHas && (
                              <button type="button" className={`${btn.ghost} ${btn.small}`} onClick={() => copyDay(prev.value, d.value)} title={`Remplace les plages du ${d.label.toLowerCase()} par celles du ${prev.label.toLowerCase()}`}>
                                <Copy className="size-3.5" aria-hidden /> Comme le {prev.label.toLowerCase()}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-ink-3">{slot ? `Soit ${totalSlots} créneau${totalSlots > 1 ? 'x' : ''} par semaine, avant déduction des rendez-vous déjà pris.` : ''}</p>
          </Card>

          <Card
            title="Fermetures exceptionnelles"
            icon={CalendarOff}
            action={
              past > 0 ? (
                <button type="button" className={`${btn.ghost} ${btn.small}`} onClick={() => up((x) => ({ ...x, closures: x.closures.filter((c) => !(c.to && c.to < today)) }))}>
                  Retirer les passées ({past})
                </button>
              ) : undefined
            }
          >
            <p className="mb-4 text-sm text-ink-2">Congés, jours fériés : aucun rendez-vous n’est proposé, et le site affiche « Fermé » ces jours-là.</p>
            {v.closures.length > 0 ? (
              <ul className="mb-3 space-y-3">
                {v.closures.map((c, i) => {
                  const isPast = c.to && c.to < today
                  return (
                    <li key={c.id ?? `new-${i}`} className={`rounded-xl border border-line p-3 ${isPast ? 'bg-soft/60' : ''}`}>
                      <div className="grid gap-3 sm:grid-cols-[10rem_10rem_minmax(0,1fr)_auto] sm:items-start">
                        <F id={fid(`closures.${i}.from`)} text="Du" error={errors[`closures.${i}.from`]}>
                          <input
                            {...errAria(fid(`closures.${i}.from`), errors[`closures.${i}.from`])}
                            type="date"
                            className={field}
                            value={c.from}
                            onChange={(e) => {
                              const val = e.target.value
                              setClosure(i, 'from', val)
                              if (val && (!c.to || c.to < val)) setClosure(i, 'to', val)
                            }}
                          />
                        </F>
                        <F id={fid(`closures.${i}.to`)} text="Au (inclus)" error={errors[`closures.${i}.to`]}>
                          <input {...errAria(fid(`closures.${i}.to`), errors[`closures.${i}.to`])} type="date" min={c.from || undefined} className={field} value={c.to} onChange={(e) => setClosure(i, 'to', e.target.value)} />
                        </F>
                        <F id={fid(`closures.${i}.reason`)} text="Motif (facultatif)">
                          <input id={fid(`closures.${i}.reason`)} className={field} value={c.reason} maxLength={120} placeholder="Ex. Congés de Noël" onChange={(e) => setClosure(i, 'reason', e.target.value)} />
                        </F>
                        <div className="flex items-center gap-2 sm:pt-6">
                          {isPast && <Badge>Passée</Badge>}
                          <button
                            type="button"
                            onClick={() => up((x) => ({ ...x, closures: x.closures.filter((_, j) => j !== i) }), `closures.${i}.from`, `closures.${i}.to`)}
                            className="flex size-10 items-center justify-center rounded-xl border border-line text-accent hover:bg-accent-soft"
                            aria-label={`Retirer la fermeture ${c.from ? `du ${fmtDay(c.from)}` : i + 1}`}
                          >
                            <X className="size-4" aria-hidden />
                          </button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="mb-3 text-sm text-ink-3">Aucune fermeture prévue.</p>
            )}
            <button type="button" className={`${btn.ghost} ${btn.small}`} onClick={() => up((x) => ({ ...x, closures: [...x.closures, { from: today, to: today, reason: '' }] }))}>
              <Plus className="size-3.5" aria-hidden /> Ajouter une fermeture
            </button>
          </Card>
        </div>

        <aside className="min-w-0">
          <div className="xl:sticky xl:top-40">
            <Card title="Prochains créneaux proposés" icon={CalendarCheck}>
              {dirty && (
                <Note tone="warn" className="mb-3 text-xs!">
                  Aperçu des réglages enregistrés. Enregistrez pour voir l’effet de vos modifications.
                </Note>
              )}
              <Preview days={preview} />
            </Card>
          </div>
        </aside>
      </div>

      <Toast message={toast} />
    </form>
  )
}

/** Ex. 45 min → « 10:00, 10:45, 11:30… ». */
function slotExample(slot: number) {
  const out: string[] = []
  for (let t = 600; t + slot <= 720 && out.length < 3; t += slot) out.push(hhmm(t))
  return `${out.join(', ')}${Math.floor(120 / slot) > 3 ? '…' : ''}`
}

function Preview({ days }: { days: DaySlots[] | null }) {
  if (!days) return <p className="text-sm text-ink-3">Aperçu indisponible pour le moment. Rechargez la page.</p>
  if (!days.length) {
    return <p className="text-sm text-ink-2">Aucun créneau libre dans les 14 prochains jours : les clients ne peuvent pas réserver en ligne. Ajoutez des plages, ou vérifiez les fermetures.</p>
  }
  const shown = days.slice(0, 5)
  return (
    <div>
      <ul className="space-y-4">
        {shown.map((d) => (
          <li key={d.date}>
            <p className={`${labelCls} mb-1.5! first-letter:uppercase`}>{d.label}</p>
            <ul className="flex flex-wrap gap-1.5">
              {d.times.slice(0, 12).map((t) => (
                <li key={t.iso} className="rounded-lg bg-soft px-2 py-1 text-xs font-bold text-primary tabular-nums">
                  {t.label}
                </li>
              ))}
              {d.times.length > 12 && <li className="px-1 py-1 text-xs text-ink-3">+{d.times.length - 12}</li>}
            </ul>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-ink-3">
        {days.length > shown.length ? `Et ${days.length - shown.length} autre${days.length - shown.length > 1 ? 's' : ''} jour${days.length - shown.length > 1 ? 's' : ''} sur les 14 prochains. ` : ''}
        Les rendez-vous déjà confirmés et le délai minimum sont déduits.
      </p>
    </div>
  )
}
