'use client'

import { CheckCircle2, Loader2, TriangleAlert } from 'lucide-react'
import Link from 'next/link'
import { useState, type ReactNode } from 'react'

import type { ActionResult } from '@/app/(frontend)/actions'

/** Réduit les photos de téléphone (souvent 4 à 8 Mo) avant l'envoi. Les PDF passent tels quels. */
export async function compressImage(file: File, maxSide = 1800, quality = 0.82): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/heic' || file.size < 400_000) return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    return blob ? new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }) : file
  } catch {
    return file
  }
}

/**
 * Formulaire commun : champ piège anti-robot, horodatage, état d'envoi, message de succès ou d'erreur.
 * `prepare` peut compléter le FormData (fichiers compressés…) avant l'appel à l'action serveur.
 */
export function ActionForm({
  action,
  children,
  success,
  prepare,
  className = '',
}: {
  action: (form: FormData) => Promise<ActionResult>
  children: ReactNode
  success: (r: Extract<ActionResult, { ok: true }>) => ReactNode
  prepare?: (form: FormData) => Promise<void> | void
  className?: string
}) {
  const [startedAt] = useState(() => Date.now())
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<ActionResult | null>(null)

  if (result?.ok) {
    return (
      <div className="card p-8 text-center" role="status">
        <CheckCircle2 className="mx-auto mb-4 size-12 text-emerald-600" aria-hidden />
        {success(result)}
      </div>
    )
  }

  return (
    <form
      className={`relative ${className}`}
      onSubmit={async (e) => {
        e.preventDefault()
        setPending(true)
        setResult(null)
        const form = new FormData(e.currentTarget)
        form.set('startedAt', String(startedAt))
        try {
          await prepare?.(form)
          setResult(await action(form))
        } catch {
          setResult({ ok: false, error: 'Envoi impossible. Vérifiez votre connexion ou appelez-nous.' })
        } finally {
          setPending(false)
        }
      }}
    >
      {/* Champ piège : invisible pour les humains, rempli par les robots */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Site web
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {/* Désactivé pendant l'envoi : empêche le double envoi */}
      <fieldset disabled={pending} className="min-w-0 disabled:opacity-70">
        {children}
      </fieldset>
      {result && !result.ok && (
        <p className="mt-4 flex items-start gap-2 rounded-2xl bg-accent-soft p-4 text-sm font-semibold text-accent-dark" role="alert">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {result.error}
        </p>
      )}
      <SubmitState pending={pending} />
    </form>
  )
}

function SubmitState({ pending }: { pending: boolean }) {
  return pending ? (
    <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-ink-2" role="status">
      <Loader2 className="size-4 animate-spin" aria-hidden /> Envoi en cours…
    </p>
  ) : null
}

export function Field({
  label,
  name,
  type = 'text',
  required,
  autoComplete,
  placeholder,
  defaultValue,
  hint,
  inputMode,
  min,
  max,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  autoComplete?: string
  placeholder?: string
  defaultValue?: string | number
  hint?: string
  inputMode?: 'numeric' | 'tel' | 'email' | 'decimal'
  min?: number
  max?: number
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-ink-2">
        {label}
        {required && <span className="text-accent"> *</span>}
      </span>
      {type === 'textarea' ? (
        <textarea name={name} required={required} placeholder={placeholder} defaultValue={defaultValue} rows={4} className="input-field" />
      ) : (
        <input
          type={type}
          name={name}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          defaultValue={defaultValue}
          inputMode={inputMode}
          min={min}
          max={max}
          className="input-field"
        />
      )}
      {hint && <span className="mt-1 block text-[11px] text-ink-3">{hint}</span>}
    </label>
  )
}

export function Select({ label, name, options, defaultValue, required }: { label: string; name: string; options: { value: string; label: string }[]; defaultValue?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-ink-2">
        {label}
        {required && <span className="text-accent"> *</span>}
      </span>
      <select name={name} defaultValue={defaultValue} required={required} className="input-field">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

/** CONF-02 : consentements explicites, jamais pré-cochés. */
export function Consents({ marketing = true }: { marketing?: boolean }) {
  return (
    <div className="space-y-2.5 text-[13px] text-ink-2">
      <label className="flex items-start gap-2.5">
        <input type="checkbox" name="privacy" required className="mt-0.5 size-4 accent-accent" />
        <span>
          J’accepte que Lease Auto utilise ces informations pour traiter ma demande, conformément à la{' '}
          <Link href="/confidentialite" className="font-semibold text-accent underline">
            politique de confidentialité
          </Link>
          . <span className="text-accent">*</span>
        </span>
      </label>
      {marketing && (
        <label className="flex items-start gap-2.5">
          <input type="checkbox" name="marketing" className="mt-0.5 size-4 accent-accent" />
          <span>Je souhaite recevoir les nouveautés du stock et les offres de Lease Auto par e-mail (désinscription en un clic).</span>
        </label>
      )}
    </div>
  )
}

export function SubmitButton({ children }: { children: ReactNode }) {
  return (
    <button type="submit" className="btn-primary mt-6 w-full sm:w-auto">
      {children}
    </button>
  )
}
