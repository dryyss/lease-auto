'use client'

import { ArrowRight, ExternalLink, Loader2, Pencil, Plus, Search, Shuffle, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useId, useMemo, useState, type FormEvent } from 'react'

import { deleteRedirect, saveRedirect } from '@/app/(gestion)/gestion/redirections/actions'
import { Dialog } from '@/components/gestion/Dialog'
import { Badge, btn, Card, Empty, field, label as labelCls } from '@/components/gestion/ui'

import { normalizeFrom, TARGETS, validateRedirect, type FieldErrors, type Options, type RedirectInput, type RedirectRow, type Target } from './shared'

const OFFLINE = 'La connexion a été interrompue. Réessayez.'
const EMPTY: RedirectInput = { from: '', toType: 'reference', relationTo: 'vehicles', refId: null, url: '' }

/** Liste des redirections, ajout, modification et suppression. */
export function RedirectManager({ rows, options }: { rows: RedirectRow[]; options: Options }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<RedirectInput | null>(null)
  const [removing, setRemoving] = useState<RedirectRow | null>(null)
  const [toast, setToast] = useState('')

  /** Destination lisible : libellé et adresse. */
  const target = (r: RedirectInput) => {
    if (r.toType === 'custom') return { label: null, path: r.url, missing: false }
    const o = options[r.relationTo]?.find((x) => x.id === r.refId)
    return o ? { label: `${TARGETS[r.relationTo].label} : ${o.label}${o.draft ? ' (brouillon)' : ''}`, path: o.path, missing: false } : { label: `${TARGETS[r.relationTo].label} supprimé`, path: '', missing: true }
  }

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter((r) => {
      const t = r.toType === 'custom' ? r.url : (options[r.relationTo]?.find((x) => x.id === r.refId)?.path ?? '')
      return r.from.toLowerCase().includes(s) || t.toLowerCase().includes(s)
    })
  }, [q, rows, options])

  const done = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(''), 3500)
    router.refresh()
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
          <label htmlFor="redirect-q" className="sr-only">
            Filtrer les redirections
          </label>
          <input id="redirect-q" type="search" className={`${field} pl-10`} placeholder="Filtrer par adresse…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button type="button" className={`${btn.primary} ml-auto`} onClick={() => setEditing({ ...EMPTY })}>
          <Plus className="size-4" aria-hidden /> Ajouter une redirection
        </button>
      </div>

      <Card padded={false}>
        {list.length ? (
          <ul className="divide-y divide-line">
            {list.map((r) => {
              const t = target(r)
              return (
                <li key={r.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center">
                  <div className="grid min-w-0 flex-1 items-center gap-1 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-3">
                    <p className="truncate font-mono text-sm text-ink-2" title={r.from}>
                      <span className="sr-only">Ancienne adresse : </span>
                      {r.from}
                    </p>
                    <ArrowRight className="hidden size-4 text-accent sm:block" aria-hidden />
                    <div className="min-w-0">
                      <span className="sr-only">Nouvelle adresse : </span>
                      {t.path && <p className="truncate font-mono text-sm font-bold text-primary">{t.path}</p>}
                      {t.label && <p className={`truncate text-xs ${t.missing ? 'font-semibold text-accent' : 'text-ink-3'}`}>{t.label}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{r.toType === 'custom' ? 'Adresse libre' : 'Page du site'}</Badge>
                    <Badge className="bg-sky-100 text-sky-800">Permanente (301)</Badge>
                    <a href={r.from} target="_blank" rel="noopener noreferrer" className={`${btn.ghost} ${btn.small}`} title="Ouvrir l’ancienne adresse pour vérifier la redirection">
                      <ExternalLink className="size-3.5" aria-hidden /> Tester<span className="sr-only"> {r.from} (nouvel onglet)</span>
                    </a>
                    <button type="button" className={`${btn.ghost} ${btn.small}`} onClick={() => setEditing({ ...r })}>
                      <Pencil className="size-3.5" aria-hidden /> Modifier<span className="sr-only"> {r.from}</span>
                    </button>
                    <button type="button" className={`${btn.danger} ${btn.small}`} onClick={() => setRemoving(r)}>
                      <Trash2 className="size-3.5" aria-hidden /> Supprimer<span className="sr-only"> {r.from}</span>
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : rows.length ? (
          <Empty icon={Search} title="Aucune redirection ne correspond." text="Essayez une autre partie de l’adresse." />
        ) : (
          <Empty icon={Shuffle} title="Aucune redirection." text="Ajoutez-en une quand une ancienne adresse du site (souvent celle de l’ancien site) doit mener vers une nouvelle page." />
        )}
      </Card>

      <p className="mt-4 text-sm text-ink-2">
        Une redirection ne s’applique que si l’ancienne adresse n’existe plus sur le site. Elle est permanente (code 301) : les moteurs de recherche remplacent l’ancienne adresse par la nouvelle.
      </p>

      <Dialog open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Modifier la redirection' : 'Nouvelle redirection'}>
        {editing && (
          <RedirectForm
            key={editing.id ?? 'new'}
            initial={editing}
            options={options}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              const isNew = !editing.id
              setEditing(null)
              done(isNew ? 'Redirection ajoutée' : 'Redirection modifiée')
            }}
          />
        )}
      </Dialog>

      <Dialog open={!!removing} onClose={() => setRemoving(null)} title="Supprimer la redirection ?">
        {removing && (
          <ConfirmDelete
            row={removing}
            onCancel={() => setRemoving(null)}
            onDone={() => {
              setRemoving(null)
              done('Redirection supprimée')
            }}
          />
        )}
      </Dialog>

      <div role="status" aria-live="polite" className="fixed right-4 bottom-4 z-50">
        {toast && <p className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-xl">{toast}</p>}
      </div>
    </>
  )
}

function RedirectForm({ initial, options, onCancel, onSaved }: { initial: RedirectInput; options: Options; onCancel: () => void; onSaved: () => void }) {
  const id = useId()
  const [v, setV] = useState<RedirectInput>(initial)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [filter, setFilter] = useState('')

  const set = <K extends keyof RedirectInput>(k: K, val: RedirectInput[K], clear?: keyof FieldErrors) => {
    setV((x) => ({ ...x, [k]: val }))
    if (clear && errors[clear]) setErrors(({ [clear]: _, ...rest }) => rest)
  }

  const pages = options[v.relationTo] ?? []
  const s = filter.trim().toLowerCase()
  const filtered = (s ? pages.filter((p) => p.label.toLowerCase().includes(s) || p.path.toLowerCase().includes(s)) : pages).slice(0, 300)
  const chosen = pages.find((p) => p.id === v.refId)
  // La page choisie reste dans la liste même si le filtre l'exclut.
  const visible = chosen && !filtered.includes(chosen) ? [chosen, ...filtered] : filtered

  async function submit(e: FormEvent) {
    e.preventDefault()
    const input = { ...v, from: normalizeFrom(v.from), url: v.url.trim() }
    setV(input)
    const local = validateRedirect(input)
    if (Object.keys(local).length) {
      setErrors(local)
      setError('')
      const first = (['from', 'refId', 'url'] as const).find((k) => local[k])
      if (first) document.getElementById(`${id}-${first}`)?.focus()
      return
    }
    setPending(true)
    setError('')
    const r = await saveRedirect(input).catch(() => ({ ok: false as const, error: OFFLINE, fields: undefined }))
    setPending(false)
    if (!r.ok) {
      setErrors(r.fields ?? {})
      return setError(r.error)
    }
    onSaved()
  }

  const aria = (k: keyof FieldErrors) => ({ id: `${id}-${k}`, 'aria-invalid': errors[k] ? true : undefined, 'aria-describedby': errors[k] ? `${id}-${k}-error` : `${id}-${k}-hint` })
  /** Erreur du champ, sinon aide. */
  const note = (k: keyof FieldErrors, hint?: string) =>
    errors[k] ? (
      <p id={`${id}-${k}-error`} className="mt-1 text-xs font-semibold text-accent">
        {errors[k]}
      </p>
    ) : hint ? (
      <p id={`${id}-${k}-hint`} className="mt-1 text-xs text-ink-3">
        {hint}
      </p>
    ) : null

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div>
        <label htmlFor={`${id}-from`} className={labelCls}>
          Ancienne adresse
        </label>
        <input
          {...aria('from')}
          className={`${field} font-mono`}
          value={v.from}
          placeholder="/occasion/peugeot-208-1234"
          autoComplete="off"
          autoFocus
          onChange={(e) => set('from', e.target.value, 'from')}
          onBlur={() => v.from.trim() && set('from', normalizeFrom(v.from))}
        />
        {note('from', 'Commence par « / ». Vous pouvez coller l’adresse complète : le nom de domaine est retiré.')}
      </div>

      <fieldset>
        <legend className={labelCls}>Nouvelle destination</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ['reference', 'Une page du site', 'Véhicule, article ou page locale : suit la page si son adresse change.'],
              ['custom', 'Une adresse libre', 'Toute autre page du site, ou un autre site.'],
            ] as const
          ).map(([value, title, text]) => (
            <label key={value} className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3 has-checked:border-primary has-checked:bg-soft">
              <input type="radio" name={`${id}-type`} value={value} checked={v.toType === value} onChange={() => set('toType', value)} className="mt-1 accent-accent" />
              <span>
                <span className="block text-sm font-bold text-primary">{title}</span>
                <span className="block text-xs text-ink-2">{text}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {v.toType === 'reference' ? (
        <div className="space-y-3">
          <div role="group" aria-label="Type de page" className="flex flex-wrap gap-1 rounded-xl border border-line bg-soft p-1">
            {(Object.keys(TARGETS) as Target[]).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={v.relationTo === t}
                onClick={() => {
                  if (t === v.relationTo) return
                  setV((x) => ({ ...x, relationTo: t, refId: null }))
                  setFilter('')
                }}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-bold transition ${v.relationTo === t ? 'bg-primary text-white' : 'text-ink-2 hover:bg-white hover:text-primary'}`}
              >
                {TARGETS[t].label} ({options[t]?.length ?? 0})
              </button>
            ))}
          </div>
          <div>
            <label htmlFor={`${id}-filter`} className="sr-only">
              Rechercher une page
            </label>
            <input id={`${id}-filter`} type="search" className={field} placeholder="Rechercher par nom ou adresse…" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          <div>
            <label htmlFor={`${id}-refId`} className={labelCls}>
              Page de destination
            </label>
            {pages.length ? (
              <select
                {...aria('refId')}
                size={7}
                className={`${field} py-1`}
                value={v.refId ?? ''}
                onChange={(e) => set('refId', e.target.value ? Number(e.target.value) : null, 'refId')}
              >
                {visible.map((p) => (
                  <option key={p.id} value={p.id} className="rounded-lg px-2 py-1.5">
                    {p.label}
                    {p.draft ? ' (brouillon)' : ''} · {p.path}
                  </option>
                ))}
              </select>
            ) : (
              <p className="rounded-xl bg-soft px-3 py-2.5 text-sm text-ink-3">Aucune page de ce type pour l’instant.</p>
            )}
            {note('refId', chosen ? `Redirige vers ${chosen.path}` : filtered.length === 0 && pages.length ? 'Aucune page ne correspond à la recherche.' : undefined)}
            {chosen?.draft && <p className="mt-1 text-xs font-semibold text-amber-700">Ce véhicule n’est pas en ligne : la redirection mènera à une page introuvable tant qu’il n’est pas publié.</p>}
          </div>
        </div>
      ) : (
        <div>
          <label htmlFor={`${id}-url`} className={labelCls}>
            Nouvelle adresse
          </label>
          <input {...aria('url')} className={`${field} font-mono`} value={v.url} placeholder="/vehicules ou https://…" autoComplete="off" onChange={(e) => set('url', e.target.value, 'url')} />
          {note('url', 'Une adresse du site qui commence par « / » (ex. /vehicules), ou un lien complet vers un autre site.')}
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-accent-soft px-3 py-2 text-sm font-semibold text-accent-dark">
          {error}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
        <button type="button" className={btn.ghost} onClick={onCancel} disabled={pending}>
          Annuler
        </button>
        <button type="submit" className={btn.primary} disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />} Enregistrer
        </button>
      </div>
    </form>
  )
}

function ConfirmDelete({ row, onCancel, onDone }: { row: RedirectRow; onCancel: () => void; onDone: () => void }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const run = async () => {
    setPending(true)
    const r = await deleteRedirect(row.id).catch(() => ({ ok: false as const, error: OFFLINE }))
    setPending(false)
    if (!r.ok) return setError(r.error)
    onDone()
  }
  return (
    <div>
      <p className="text-sm text-ink-2">
        Les visiteurs qui arrivent sur <strong className="font-mono text-primary">{row.from}</strong> verront de nouveau une page introuvable.
      </p>
      {error && (
        <p role="alert" className="mt-3 text-sm font-semibold text-accent">
          {error}
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button type="button" className={btn.ghost} onClick={onCancel} autoFocus>
          Annuler
        </button>
        <button type="button" className={`${btn.danger} border-accent! bg-accent! text-white! hover:bg-accent-dark!`} disabled={pending} onClick={run}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Trash2 className="size-4" aria-hidden />} Supprimer
        </button>
      </div>
    </div>
  )
}
