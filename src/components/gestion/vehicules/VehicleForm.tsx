'use client'

import { Camera, CheckCircle2, Euro, ExternalLink, FileText, Gauge, IdCard, ListChecks, Loader2, Plus, Save, Trash2, TriangleAlert, Upload, Undo2, X } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'

import { createBrand, createModel, deleteVehicle, saveVehicle } from '@/app/(gestion)/gestion/vehicules/actions'
import { Badge, btn, Card, field, label as labelCls, PageHeader } from '@/components/gestion/ui'
import { ago, euro, VEHICLE_STATUS } from '@/lib/gestion/labels'
import type { Vehicle } from '@/payload-types'

import { PhotoManager } from './PhotoManager'
import {
  BODY_OPTIONS,
  CRITAIR_OPTIONS,
  FIELD_LABELS,
  FORMULA_LABELS,
  FUEL_OPTIONS,
  GEARBOX_OPTIONS,
  formatPlate,
  isSivPlate,
  parseList,
  suggestTitle,
  validateVehicle,
  type FieldErrors,
  type Formula,
  type ModelOption,
  type MonthlyInput,
  type Option,
  type Photo,
  type VehicleInput,
} from './shared'

type Computed = { formula: Formula; manual: boolean; amount: number | null; months: number | null; deposit: number | null }
type Status = Vehicle['status']
type NumKey = 'year' | 'mileage' | 'powerHp' | 'fiscalHp' | 'doors' | 'seats' | 'co2' | 'warrantyMonths' | 'price'

// Ordre des champs à l'écran : sert à placer le curseur sur la première erreur.
const ORDER = ['gallery', 'brand', 'model', 'title', 'reference', 'plate', 'year', 'firstRegistration', 'mileage', 'fuel', 'gearbox', 'bodyType', 'powerHp', 'fiscalHp', 'doors', 'seats', 'color', 'co2', 'critAir', 'warrantyMonths', 'price', 'monthlies']

const STATUS_TONE_ACTIVE: Record<Status, string> = {
  available: 'bg-emerald-600 text-white',
  reserved: 'bg-amber-500 text-white',
  sold: 'bg-slate-600 text-white',
}

export function VehicleForm({
  initial,
  initialPhotos,
  brands: initialBrands,
  models: initialModels,
  published,
  slug,
  computed = [],
  monthlyFrom = null,
  isAdmin,
  justSaved = false,
  richDescription = false,
  updatedAt,
}: {
  initial: VehicleInput
  initialPhotos: Photo[]
  brands: Option[]
  models: ModelOption[]
  published: boolean
  slug?: string | null
  computed?: Computed[]
  monthlyFrom?: number | null
  isAdmin: boolean
  justSaved?: boolean
  richDescription?: boolean
  updatedAt?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const id = initial.id
  const [v, setV] = useState<VehicleInput>(initial)
  const [desc, setDesc] = useState(initial.description ?? '')
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [brands, setBrands] = useState(initialBrands)
  const [models, setModels] = useState(initialModels)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [globalError, setGlobalError] = useState('')
  const [pending, setPending] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [toast, setToast] = useState(justSaved ? 'Enregistré' : '')
  const dialog = useRef<HTMLDialogElement>(null)
  const [deleteError, setDeleteError] = useState('')

  // Toast après création : on retire ?enregistre=1 de l'adresse.
  useEffect(() => {
    if (justSaved) router.replace(pathname, { scroll: false })
  }, [justSaved, pathname, router])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(t)
  }, [toast])
  // Alerte du navigateur si on quitte la page avec des modifications non enregistrées.
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const brandName = brands.find((b) => b.id === v.brand)?.name
  const modelName = models.find((m) => m.id === v.model)?.name
  const suggestion = suggestTitle(brandName, modelName)
  const brandModels = models.filter((m) => m.brand === v.brand)

  function set<K extends keyof VehicleInput>(key: K, value: VehicleInput[K]) {
    setV((x) => ({ ...x, [key]: value }))
    setDirty(true)
    if (errors[key as string]) setErrors(({ [key as string]: _, ...rest }) => rest)
  }

  /** Marque ou modèle changé : le titre suit la suggestion tant qu'il n'a pas été écrit à la main. */
  function pick(brand: number | null, model: number | null) {
    const next = suggestTitle(brands.find((b) => b.id === brand)?.name, models.find((m) => m.id === model)?.name)
    setV((x) => ({ ...x, brand, model, title: !x.title.trim() || x.title === suggestion ? next : x.title }))
    setDirty(true)
    setErrors(({ brand: _b, model: _m, title: _t, ...rest }) => rest)
  }

  const num = (k: NumKey, extra: { step?: string; min?: number; max?: number } = {}) => ({
    id: `f-${k}`,
    type: 'number' as const,
    inputMode: (extra.step ? 'decimal' : 'numeric') as 'decimal' | 'numeric',
    min: extra.min ?? 0,
    max: extra.max,
    step: extra.step ?? '1',
    value: v[k] ?? '',
    onChange: (e: { target: { value: string } }) => set(k, e.target.value === '' ? null : Number(e.target.value)),
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': errors[k] ? `f-${k}-error` : undefined,
    className: field,
  })
  const aria = (k: string) => ({ id: `f-${k}`, 'aria-invalid': errors[k] ? true : undefined, 'aria-describedby': errors[k] ? `f-${k}-error` : undefined })

  function showErrors(fields: FieldErrors, message: string) {
    setErrors(fields)
    setGlobalError(message)
    const first = ORDER.find((k) => fields[k])
    if (first) requestAnimationFrame(() => document.getElementById(`f-${first}`)?.focus())
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function save({ publish = published, status = v.status, key = 'save' }: { publish?: boolean; status?: Status; key?: string } = {}) {
    if (uploading) {
      setGlobalError('Attendez la fin de l’envoi des photos avant d’enregistrer.')
      return
    }
    const title = v.title.trim() || suggestion
    const input: VehicleInput = {
      ...v,
      id,
      title,
      status,
      publish,
      plate: v.plate.trim() ? formatPlate(v.plate) : '',
      gallery: photos.map((p) => p.id),
      // Description inchangée : on garde la version enregistrée telle quelle.
      description: id && desc === (initial.description ?? '') ? null : desc,
    }
    const local = validateVehicle(input)
    if (Object.keys(local).length) {
      const names = Object.keys(local).map((k) => FIELD_LABELS[k] ?? k)
      showErrors(local, publish ? `Pour mettre l’annonce en ligne, complétez : ${names.join(', ')}.` : `À corriger : ${names.join(', ')}.`)
      return
    }
    setPending(key)
    setGlobalError('')
    const r = await saveVehicle(input).catch(() => ({ ok: false as const, error: 'La connexion a été interrompue. Vos saisies sont toujours là : réessayez.', fields: undefined }))
    setPending(null)
    if (!r.ok) {
      showErrors(r.fields ?? {}, r.error)
      return
    }
    setErrors({})
    setDirty(false)
    setV((x) => ({ ...x, title, status, plate: input.plate, publish }))
    if (!id) {
      router.replace(`/gestion/vehicules/${r.id}?enregistre=1`)
      return
    }
    setToast(key === 'publish' ? 'Annonce mise en ligne' : key === 'unpublish' ? 'Annonce repassée en brouillon' : key === 'status' ? `Disponibilité : ${VEHICLE_STATUS[status]}` : 'Enregistré')
    router.refresh()
  }

  async function onDelete() {
    if (!id) return
    setPending('delete')
    const r = await deleteVehicle(id).catch(() => ({ ok: false as const, error: 'La connexion a été interrompue. Réessayez.' }))
    setPending(null)
    if (!r.ok) return setDeleteError(r.error)
    setDirty(false)
    dialog.current?.close()
    router.push('/gestion/vehicules')
    router.refresh()
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void save()
  }

  const busy = pending !== null
  const spin = (key: string, icon: ReactNode) => (pending === key ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon)

  return (
    <form onSubmit={onSubmit} noValidate>
      <PageHeader
        back={{ href: '/gestion/vehicules', label: 'Véhicules' }}
        title={v.title || suggestion || (id ? 'Sans titre' : 'Nouveau véhicule')}
        subtitle={id ? `Fiche n° ${id}${updatedAt ? ` · modifiée ${ago(updatedAt)}` : ''}` : 'Commencez par les photos : elles s’envoient tout de suite, même avant le premier enregistrement.'}
      />

      {/* Barre d'actions collante */}
      <div className="sticky top-16 z-20 -mx-4 mb-6 border-y border-line bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {published ? <Badge className="bg-primary text-white">En ligne</Badge> : <Badge className="bg-white text-ink-2 ring-1 ring-line">Brouillon</Badge>}
            {published ? (
              <button type="button" className={`${btn.ghost} ${btn.small}`} disabled={busy || !id} onClick={() => save({ publish: false, key: 'unpublish' })}>
                {spin('unpublish', <Undo2 className="size-3.5" aria-hidden />)} Repasser en brouillon
              </button>
            ) : (
              <button type="button" className={`${btn.dark} ${btn.small}`} disabled={busy} onClick={() => save({ publish: true, key: 'publish' })}>
                {spin('publish', <Upload className="size-3.5" aria-hidden />)} Publier
              </button>
            )}
          </div>

          <div role="group" aria-label="Disponibilité" className="flex rounded-xl border border-line bg-soft p-1">
            {(['available', 'reserved', 'sold'] as Status[]).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={v.status === s}
                disabled={busy}
                onClick={() => (id ? save({ status: s, key: 'status' }) : set('status', s))}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition focus-visible:ring-3 focus-visible:ring-accent/40 focus-visible:outline-none ${v.status === s ? STATUS_TONE_ACTIVE[s] : 'text-ink-2 hover:bg-white hover:text-primary'}`}
              >
                {VEHICLE_STATUS[s]}
              </button>
            ))}
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {dirty && <span className="text-xs font-semibold text-amber-700">Modifications non enregistrées</span>}
            {published && slug && (
              <a href={`/vehicule/${slug}`} target="_blank" rel="noopener noreferrer" className={`${btn.ghost} ${btn.small}`}>
                <ExternalLink className="size-3.5" aria-hidden /> Voir l’annonce
                <span className="sr-only"> (nouvel onglet)</span>
              </a>
            )}
            {id && isAdmin && (
              <button
                type="button"
                className={`${btn.danger} ${btn.small}`}
                disabled={busy}
                onClick={() => {
                  setDeleteError('')
                  dialog.current?.showModal()
                }}
              >
                <Trash2 className="size-3.5" aria-hidden /> Supprimer
              </button>
            )}
            <button type="submit" className={btn.primary} disabled={busy || uploading}>
              {spin('save', <Save className="size-4" aria-hidden />)} Enregistrer
            </button>
          </div>
        </div>
      </div>

      {globalError && (
        <div role="alert" className="mb-6 flex items-start gap-3 rounded-2xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm font-semibold text-accent-dark">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p className="flex-1">{globalError}</p>
          <button type="button" onClick={() => setGlobalError('')} className="rounded-lg p-0.5 hover:bg-white/60" aria-label="Fermer le message">
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}

      <div className="mx-auto max-w-5xl space-y-6">
        <Card title={`Photos (${photos.length})`} icon={Camera}>
          <PhotoManager
            photos={photos}
            onChange={(next) => {
              setPhotos(next)
              setDirty(true)
              if (errors.gallery) setErrors(({ gallery: _, ...rest }) => rest)
            }}
            title={v.title || suggestion}
            error={errors.gallery}
            onBusyChange={setUploading}
          />
        </Card>

        <Card title="Identité" icon={IdCard}>
          <div className="grid gap-4 sm:grid-cols-2">
            <F id="brand" text="Marque" required error={errors.brand}>
              <select {...aria('brand')} className={field} value={v.brand ?? ''} onChange={(e) => pick(e.target.value ? Number(e.target.value) : null, null)}>
                <option value="">Choisir la marque…</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <InlineCreate
                label="Nouvelle marque"
                placeholder="Ex. Peugeot"
                onCreate={async (name) => {
                  const r = await createBrand(name)
                  if (!r.ok) return r.error
                  setBrands((list) => (list.some((b) => b.id === r.brand.id) ? list : [...list, r.brand].sort((a, b) => a.name.localeCompare(b.name, 'fr'))))
                  pick(r.brand.id, null)
                  return null
                }}
              />
            </F>
            <F id="model" text="Modèle" required error={errors.model}>
              <select {...aria('model')} className={field} value={v.model ?? ''} disabled={!v.brand} onChange={(e) => pick(v.brand, e.target.value ? Number(e.target.value) : null)}>
                <option value="">{v.brand ? (brandModels.length ? 'Choisir le modèle…' : 'Aucun modèle : ajoutez-le') : 'Choisissez d’abord la marque'}</option>
                {brandModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {v.brand && (
                <InlineCreate
                  label="Nouveau modèle"
                  placeholder="Ex. 3008"
                  onCreate={async (name) => {
                    const r = await createModel(v.brand!, name)
                    if (!r.ok) return r.error
                    setModels((list) => (list.some((m) => m.id === r.model.id) ? list : [...list, r.model].sort((a, b) => a.name.localeCompare(b.name, 'fr'))))
                    pick(v.brand, r.model.id)
                    return null
                  }}
                />
              )}
            </F>
            <F id="title" text="Titre de l’annonce" required error={errors.title} hint="Ex. Peugeot 3008 1.2 PureTech 130 Allure. Il apparaît sur le site." className="sm:col-span-2">
              <input {...aria('title')} className={field} value={v.title} placeholder={suggestion || 'Marque, modèle, motorisation, finition'} onChange={(e) => set('title', e.target.value)} maxLength={140} />
              {!v.title.trim() && suggestion && (
                <button type="button" onClick={() => set('title', suggestion)} className="mt-1.5 text-xs font-bold text-accent hover:underline">
                  Utiliser « {suggestion} »
                </button>
              )}
            </F>
            <F id="reference" text="Référence interne" error={errors.reference} hint="Facultatif. Sert à retrouver la fiche.">
              <input {...aria('reference')} className={field} value={v.reference} onChange={(e) => set('reference', e.target.value)} maxLength={60} />
            </F>
            <F
              id="plate"
              text="Immatriculation"
              error={errors.plate}
              hint={v.plate.trim() && !isSivPlate(v.plate) ? 'Format inhabituel : on attend AB-123-CD. Vérifiez la saisie.' : 'Format AB-123-CD. Visible seulement par l’équipe.'}
            >
              <input
                {...aria('plate')}
                className={`${field} font-mono tracking-wider uppercase`}
                value={v.plate}
                placeholder="AB-123-CD"
                autoComplete="off"
                maxLength={20}
                onChange={(e) => set('plate', e.target.value.toUpperCase())}
                onBlur={() => v.plate.trim() && setV((x) => ({ ...x, plate: formatPlate(x.plate) }))}
              />
            </F>
            <label className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-3 text-sm font-semibold text-primary sm:col-span-2">
              <input type="checkbox" className="size-4 accent-accent" checked={v.featured} onChange={(e) => set('featured', e.target.checked)} />
              À la une : mettre en avant sur la page d’accueil
            </label>
          </div>
        </Card>

        <Card title="Caractéristiques" icon={Gauge}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <F id="year" text="Année" required error={errors.year}>
              <input {...num('year', { min: 1990, max: new Date().getFullYear() + 1 })} placeholder="2021" />
            </F>
            <F id="firstRegistration" text="Mise en circulation" error={errors.firstRegistration}>
              <input
                {...aria('firstRegistration')}
                type="date"
                className={field}
                value={v.firstRegistration}
                onChange={(e) => {
                  const value = e.target.value
                  set('firstRegistration', value)
                  if (value && v.year == null) setV((x) => ({ ...x, year: Number(value.slice(0, 4)) }))
                }}
              />
            </F>
            <F id="mileage" text="Kilométrage (km)" required error={errors.mileage}>
              <input {...num('mileage')} placeholder="45000" />
            </F>
            <F id="fuel" text="Carburant" required error={errors.fuel}>
              <select {...aria('fuel')} className={field} value={v.fuel} onChange={(e) => set('fuel', e.target.value as VehicleInput['fuel'])}>
                <option value="">Choisir…</option>
                {FUEL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </F>
            <F id="gearbox" text="Boîte" required error={errors.gearbox}>
              <select {...aria('gearbox')} className={field} value={v.gearbox} onChange={(e) => set('gearbox', e.target.value as VehicleInput['gearbox'])}>
                <option value="">Choisir…</option>
                {GEARBOX_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </F>
            <F id="bodyType" text="Carrosserie" error={errors.bodyType}>
              <select {...aria('bodyType')} className={field} value={v.bodyType} onChange={(e) => set('bodyType', e.target.value as VehicleInput['bodyType'])}>
                <option value="">Non précisée</option>
                {BODY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </F>
            <F id="powerHp" text="Puissance (ch)" error={errors.powerHp}>
              <input {...num('powerHp')} />
            </F>
            <F id="fiscalHp" text="Puissance fiscale (CV)" error={errors.fiscalHp}>
              <input {...num('fiscalHp')} />
            </F>
            <F id="doors" text="Portes" error={errors.doors}>
              <input {...num('doors', { max: 9 })} />
            </F>
            <F id="seats" text="Places" error={errors.seats}>
              <input {...num('seats', { max: 9 })} />
            </F>
            <F id="color" text="Couleur" error={errors.color}>
              <input {...aria('color')} className={field} value={v.color} onChange={(e) => set('color', e.target.value)} maxLength={60} />
            </F>
            <F id="co2" text="CO₂ (g/km)" error={errors.co2}>
              <input {...num('co2')} />
            </F>
            <F id="critAir" text="Crit’Air" error={errors.critAir}>
              <select {...aria('critAir')} className={field} value={v.critAir} onChange={(e) => set('critAir', e.target.value as VehicleInput['critAir'])}>
                <option value="">Non précisé</option>
                {CRITAIR_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o === '0' ? '0 (électrique)' : o}
                  </option>
                ))}
              </select>
            </F>
            <F id="warrantyMonths" text="Garantie (mois)" error={errors.warrantyMonths}>
              <input {...num('warrantyMonths')} />
            </F>
          </div>
        </Card>

        <Card title="Prix" icon={Euro}>
          <div className="grid gap-4 sm:grid-cols-2">
            <F id="price" text="Prix total TTC (€)" required error={errors.price}>
              <input {...num('price')} placeholder="18990" />
            </F>
            <div className="self-end rounded-xl bg-soft px-4 py-3 text-sm text-ink-2">
              {monthlyFrom ? (
                <>
                  Affiché sur le site : <strong className="text-primary">dès {euro(monthlyFrom)}/mois</strong>
                </>
              ) : (
                'La mensualité « à partir de » est calculée à l’enregistrement.'
              )}
            </div>
          </div>

          <h3 className="mt-6 mb-1 text-sm font-black text-primary">Mensualités par formule</h3>
          <p className="mb-3 text-xs text-ink-3">Calculées automatiquement avec les taux des Réglages. Cochez « Saisie manuelle » pour imposer vos chiffres.</p>
          {errors.monthlies && (
            <p id="f-monthlies-error" className="mb-2 text-sm font-semibold text-accent">
              {errors.monthlies}
            </p>
          )}
          <div className="grid gap-3 lg:grid-cols-3" id="f-monthlies" tabIndex={-1}>
            {v.monthlies.map((m, i) => (
              <MonthlyBox
                key={m.formula}
                value={m}
                computed={computed.find((c) => c.formula === m.formula)}
                isNew={!id}
                onChange={(next) =>
                  set(
                    'monthlies',
                    v.monthlies.map((x, k) => (k === i ? next : x)),
                  )
                }
              />
            ))}
          </div>
        </Card>

        <Card title={`Équipements (${v.equipment.length})`} icon={ListChecks}>
          <EquipmentEditor items={v.equipment} onChange={(items) => set('equipment', items)} />
        </Card>

        <Card title="Description" icon={FileText}>
          <label htmlFor="f-description" className={labelCls}>
            Texte de l’annonce
          </label>
          <textarea
            id="f-description"
            className={`${field} min-h-48 leading-relaxed`}
            value={desc}
            onChange={(e) => {
              setDesc(e.target.value)
              setDirty(true)
            }}
            placeholder="Historique, entretien, état, points forts…"
          />
          <p className="mt-1.5 text-xs text-ink-3">Laissez une ligne vide entre deux paragraphes.</p>
          {richDescription && (
            <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              La description actuelle contient une mise en forme (gras, listes ou titres). Elle est conservée tant que vous ne modifiez pas ce texte ; si vous le modifiez, elle sera remplacée par du texte simple.
            </p>
          )}
        </Card>

        <div className="flex justify-end pb-6">
          <button type="submit" className={btn.primary} disabled={busy || uploading}>
            {spin('save', <Save className="size-4" aria-hidden />)} Enregistrer
          </button>
        </div>
      </div>

      <dialog
        ref={dialog}
        aria-labelledby="delete-title"
        className="m-auto w-[min(92vw,28rem)] rounded-2xl border border-line bg-white p-0 shadow-2xl backdrop:bg-primary/40 backdrop:backdrop-blur-sm"
      >
        <div className="p-6">
          <h2 id="delete-title" className="text-lg font-black text-primary">
            Supprimer ce véhicule ?
          </h2>
          <p className="mt-2 text-sm text-ink-2">
            « {v.title || 'Sans titre'} » sera supprimé définitivement, avec son historique. L’annonce disparaîtra du site. Pour un véhicule vendu, préférez la disponibilité « Vendu ».
          </p>
          {deleteError && (
            <p role="alert" className="mt-3 text-sm font-semibold text-accent">
              {deleteError}
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button type="button" className={btn.ghost} onClick={() => dialog.current?.close()} autoFocus>
              Annuler
            </button>
            <button type="button" className={`${btn.danger} border-accent! bg-accent! text-white! hover:bg-accent-dark!`} disabled={busy} onClick={onDelete}>
              {spin('delete', <Trash2 className="size-4" aria-hidden />)} Supprimer définitivement
            </button>
          </div>
        </div>
      </dialog>

      {/* Zone toujours présente pour que le message soit lu par les lecteurs d'écran. */}
      <div role="status" aria-live="polite" className="fixed right-4 bottom-4 z-50">
        {toast && (
          <p className="flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-xl">
            <CheckCircle2 className="size-4 text-emerald-300" aria-hidden /> {toast}
          </p>
        )}
      </div>
    </form>
  )
}

/** Libellé + champ + aide ou erreur. Le champ porte l'id `f-<id>`. */
function F({ id, text, required, error, hint, className = '', children }: { id: string; text: string; required?: boolean; error?: string; hint?: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={`f-${id}`} className={labelCls}>
        {text}
        {required && (
          <span className="text-accent" title="Obligatoire pour publier">
            {' '}
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`f-${id}-error`} className="mt-1 text-xs font-semibold text-accent">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-ink-3">{hint}</p>
      )}
    </div>
  )
}

/** Petit champ « Nouvelle marque / Nouveau modèle » sous une liste déroulante. */
function InlineCreate({ label, placeholder, onCreate }: { label: string; placeholder: string; onCreate: (name: string) => Promise<string | null> }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const inputId = `new-${label.replace(/\W+/g, '-').toLowerCase()}`

  async function add() {
    if (!name.trim()) return setError('Indiquez un nom.')
    setPending(true)
    const err = await onCreate(name).catch(() => 'La connexion a été interrompue. Réessayez.')
    setPending(false)
    if (err) return setError(err)
    setName('')
    setError('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline">
        <Plus className="size-3.5" aria-hidden /> {label}
      </button>
    )
  }
  return (
    <div className="mt-2 rounded-xl border border-line bg-soft p-2.5">
      <label htmlFor={inputId} className={labelCls}>
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          className={field}
          value={name}
          placeholder={placeholder}
          autoFocus
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void add()
            }
            if (e.key === 'Escape') setOpen(false)
          }}
        />
        <button type="button" className={`${btn.dark} ${btn.small}`} onClick={add} disabled={pending}>
          {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null} Ajouter
        </button>
        <button type="button" className={`${btn.ghost} ${btn.small}`} onClick={() => setOpen(false)} aria-label="Annuler">
          <X className="size-3.5" aria-hidden />
        </button>
      </div>
      {error && <p className="mt-1 text-xs font-semibold text-accent">{error}</p>}
    </div>
  )
}

/** Une formule : montant calculé, ou saisie manuelle. */
function MonthlyBox({ value: m, computed, isNew, onChange }: { value: MonthlyInput; computed?: Computed; isNew: boolean; onChange: (m: MonthlyInput) => void }) {
  const id = `m-${m.formula}`
  const n = (s: string) => (s === '' ? null : Number(s))
  return (
    <div className={`rounded-xl border p-4 ${m.manual ? 'border-accent/40 bg-accent-soft/40' : 'border-line'}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <strong className="text-primary">{FORMULA_LABELS[m.formula]}</strong>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-2">
          <input
            type="checkbox"
            className="size-3.5 accent-accent"
            checked={m.manual}
            onChange={(e) =>
              onChange(
                e.target.checked
                  ? { ...m, manual: true, amount: m.amount ?? computed?.amount ?? null, months: m.months ?? computed?.months ?? null, deposit: m.deposit ?? computed?.deposit ?? null }
                  : { ...m, manual: false },
              )
            }
          />
          Saisie manuelle
        </label>
      </div>
      {m.manual ? (
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label htmlFor={`${id}-amount`} className={labelCls}>
              €/mois
            </label>
            <input id={`${id}-amount`} type="number" inputMode="decimal" min={0} step="0.01" className={field} value={m.amount ?? ''} onChange={(e) => onChange({ ...m, amount: n(e.target.value) })} />
          </div>
          <div>
            <label htmlFor={`${id}-months`} className={labelCls}>
              Mois
            </label>
            <input id={`${id}-months`} type="number" inputMode="numeric" min={0} className={field} value={m.months ?? ''} onChange={(e) => onChange({ ...m, months: n(e.target.value) })} />
          </div>
          <div>
            <label htmlFor={`${id}-deposit`} className={labelCls}>
              Apport €
            </label>
            <input id={`${id}-deposit`} type="number" inputMode="numeric" min={0} className={field} value={m.deposit ?? ''} onChange={(e) => onChange({ ...m, deposit: n(e.target.value) })} />
          </div>
        </div>
      ) : isNew ? (
        <p className="text-sm text-ink-3">Calculée au premier enregistrement.</p>
      ) : computed?.amount && !computed.manual ? (
        <p className="text-sm text-ink-2">
          <strong className="text-lg font-black text-primary">{euro(computed.amount)}</strong>/mois
          <span className="block text-xs text-ink-3">
            sur {computed.months ?? '—'} mois, apport {euro(computed.deposit ?? 0)}
          </span>
        </p>
      ) : (
        <p className="text-sm text-ink-3">Pas de montant : formule désactivée dans les Réglages, ou prix manquant. Recalculée à l’enregistrement.</p>
      )}
    </div>
  )
}

/** Liste d'équipements : modifier, retirer, ajouter un par un ou coller une liste. */
function EquipmentEditor({ items, onChange }: { items: string[]; onChange: (items: string[]) => void }) {
  const [draft, setDraft] = useState('')
  const [pasteOpen, setPasteOpen] = useState(false)
  const [paste, setPaste] = useState('')

  const addMany = (labels: string[]) => {
    const seen = new Set(items.map((x) => x.toLowerCase()))
    const fresh = labels.filter((l) => !seen.has(l.toLowerCase()) && seen.add(l.toLowerCase()))
    if (fresh.length) onChange([...items, ...fresh])
  }

  return (
    <div>
      {items.length > 0 ? (
        <ul className="mb-4 grid gap-2 sm:grid-cols-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-2">
              <label htmlFor={`eq-${i}`} className="sr-only">
                Équipement {i + 1}
              </label>
              <input id={`eq-${i}`} className={field} value={item} onChange={(e) => onChange(items.map((x, k) => (k === i ? e.target.value : x)))} />
              <button
                type="button"
                onClick={() => onChange(items.filter((_, k) => k !== i))}
                className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line text-accent hover:bg-accent-soft focus-visible:ring-3 focus-visible:ring-accent/40 focus-visible:outline-none"
                aria-label={`Retirer « ${item || `équipement ${i + 1}`} »`}
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-sm text-ink-3">Aucun équipement pour l’instant.</p>
      )}

      <div className="flex flex-wrap gap-2">
        <label htmlFor="eq-new" className="sr-only">
          Nouvel équipement
        </label>
        <input
          id="eq-new"
          className={`${field} min-w-0 flex-1`}
          value={draft}
          placeholder="Ex. Caméra de recul"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (draft.trim()) addMany([draft.trim()])
              setDraft('')
            }
          }}
        />
        <button
          type="button"
          className={btn.ghost}
          onClick={() => {
            if (draft.trim()) addMany([draft.trim()])
            setDraft('')
          }}
        >
          <Plus className="size-4" aria-hidden /> Ajouter
        </button>
        <button type="button" className={btn.ghost} onClick={() => setPasteOpen((o) => !o)} aria-expanded={pasteOpen}>
          Coller une liste
        </button>
      </div>

      {pasteOpen && (
        <div className="mt-3">
          <label htmlFor="eq-paste" className={labelCls}>
            Une ligne par équipement (les puces et tirets sont retirés)
          </label>
          <textarea id="eq-paste" className={`${field} min-h-32`} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={'Climatisation automatique\nRégulateur de vitesse\nApple CarPlay'} />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className={`${btn.dark} ${btn.small}`}
              onClick={() => {
                addMany(parseList(paste))
                setPaste('')
                setPasteOpen(false)
              }}
            >
              Ajouter ces lignes
            </button>
            {items.length > 0 && (
              <button type="button" className={`${btn.ghost} ${btn.small}`} onClick={() => onChange([])}>
                Tout effacer
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
