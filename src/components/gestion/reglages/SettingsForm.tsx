'use client'

import { ArrowDown, ArrowUp, Building2, CheckCircle2, CircleAlert, Clock, ExternalLink, Landmark, Phone, Plus, Scale, Share2, Timer, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent, type ReactNode } from 'react'

import { saveSettings } from '@/app/(gestion)/gestion/reglages/actions'
import { MarkdownEditor } from '@/components/gestion/MarkdownEditor'
import { btn, Card, field } from '@/components/gestion/ui'

import { ErrorBanner, errAria, F, Note, SaveBar, Toast, toNum, useLeaveWarning, useToast } from './form'
import { hoursSummary, rowUnderstood } from './hours'
import { FIELD_ORDER, fid, fieldName, FORMULA_KEYS, isEmail, validateSettings, type FieldErrors, type FormulaInput, type FormulaKey, type SettingsInput } from './shared'

type Company = Omit<SettingsInput['company'], 'notificationEmails'>
type Legal = { legalNotice: string; privacyPolicy: string; terms: string }

const NAV = [
  { href: '#entreprise', label: 'Entreprise' },
  { href: '#coordonnees', label: 'Coordonnées' },
  { href: '#horaires', label: 'Horaires' },
  { href: '#reseaux', label: 'Réseaux sociaux' },
  { href: '#financement', label: 'Financement' },
  { href: '#delais', label: 'Délais' },
  { href: '#mentions', label: 'Mentions légales' },
]

const FORMULA_TITLES: Record<FormulaKey, { title: string; text: string }> = {
  loa: { title: 'LOA', text: 'Location avec option d’achat' },
  lld: { title: 'LLD', text: 'Location longue durée' },
  credit: { title: 'Crédit', text: 'Crédit auto affecté' },
}

// Mention de l'article L312-5 du Code de la consommation.
const LEGAL_FR = 'Un crédit vous engage et doit être remboursé. Vérifiez vos capacités de remboursement avant de vous engager.'

export function SettingsForm({ initial }: { initial: SettingsInput }) {
  const router = useRouter()
  const initialLegal: Legal = { legalNotice: initial.legal.legalNotice ?? '', privacyPolicy: initial.legal.privacyPolicy ?? '', terms: initial.legal.terms ?? '' }
  const [v, setV] = useState<SettingsInput>(initial)
  const [legal, setLegal] = useState<Legal>(initialLegal)
  const [savedLegal, setSavedLegal] = useState<Legal>(initialLegal)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [globalError, setGlobalError] = useState('')
  const [pending, setPending] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [toast, setToast] = useToast()
  useLeaveWarning(dirty)

  /** Modifie l'état et efface l'erreur du champ touché. */
  function up(key: string, fn: (x: SettingsInput) => SettingsInput) {
    setV(fn)
    setDirty(true)
    if (errors[key]) setErrors(({ [key]: _, ...rest }) => rest)
  }

  function showErrors(fields: FieldErrors, message: string) {
    setErrors(fields)
    setGlobalError(message)
    const first = FIELD_ORDER.find((k) => fields[k]) ?? Object.keys(fields).find((k) => document.getElementById(fid(k)))
    if (first) requestAnimationFrame(() => document.getElementById(fid(first))?.focus())
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const input: SettingsInput = {
      ...v,
      legal: {
        legalNotice: legal.legalNotice === savedLegal.legalNotice ? null : legal.legalNotice,
        privacyPolicy: legal.privacyPolicy === savedLegal.privacyPolicy ? null : legal.privacyPolicy,
        terms: legal.terms === savedLegal.terms ? null : legal.terms,
      },
    }
    const local = validateSettings(input)
    if (Object.keys(local).length) return showErrors(local, `À corriger : ${[...new Set(Object.keys(local).map(fieldName))].join(', ')}.`)
    setPending(true)
    setGlobalError('')
    const r = await saveSettings(input).catch(() => ({ ok: false as const, error: 'La connexion a été interrompue. Vos saisies sont toujours là : réessayez.', fields: undefined }))
    setPending(false)
    if (!r.ok) return showErrors(r.fields ?? {}, r.error)
    setErrors({})
    setDirty(false)
    setSavedLegal(legal)
    setToast('Réglages enregistrés : le site est à jour.')
    router.refresh()
  }

  const company = (k: keyof Company, text: string, opts: { hint?: ReactNode; type?: string; placeholder?: string; className?: string; inputMode?: 'tel' | 'numeric' | 'email' | 'url' } = {}) => {
    const key = `company.${k}`
    return (
      <F id={fid(key)} text={text} hint={opts.hint} error={errors[key]} className={opts.className}>
        <input
          {...errAria(fid(key), errors[key])}
          type={opts.type ?? 'text'}
          inputMode={opts.inputMode}
          className={field}
          value={v.company[k]}
          placeholder={opts.placeholder}
          onChange={(e) => up(key, (x) => ({ ...x, company: { ...x.company, [k]: e.target.value } }))}
        />
      </F>
    )
  }

  const summary = hoursSummary(v.openingHours)
  const anyRate = FORMULA_KEYS.some((k) => v.financing[k].enabled && v.financing[k].annualRate != null)

  return (
    <form onSubmit={onSubmit} noValidate>
      <SaveBar nav={NAV} dirty={dirty} pending={pending} />
      <ErrorBanner message={globalError} onClose={() => setGlobalError('')} />

      <div className="mx-auto max-w-5xl space-y-6">
        <Section id="entreprise">
          <Card title="Entreprise" icon={Building2}>
            <p className="mb-4 text-sm text-ink-2">Identité légale : elle apparaît dans le pied de page, les mentions légales et les e-mails envoyés aux clients.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {company('name', 'Raison sociale')}
              {company('legalForm', 'Forme et capital', { placeholder: 'Ex. SAS au capital de 10 000 €' })}
              {company('siren', 'SIREN', { inputMode: 'numeric', placeholder: '9 chiffres' })}
              {company('rcs', 'RCS', { placeholder: 'Ex. RCS Bobigny 123 456 789' })}
              {company('orias', 'N° ORIAS', { hint: 'Immatriculation d’intermédiaire en crédit : obligatoire pour présenter des offres de financement.' })}
              <div className="hidden sm:block" />
              {company('address', 'Adresse', { className: 'sm:col-span-2' })}
              {company('postalCode', 'Code postal', { inputMode: 'numeric' })}
              {company('city', 'Ville')}
            </div>
          </Card>
        </Section>

        <Section id="coordonnees">
          <Card title="Coordonnées" icon={Phone}>
            <div className="grid gap-4 sm:grid-cols-2">
              {company('phone', 'Téléphone', { type: 'tel', inputMode: 'tel', hint: 'Affiché en haut du site et sur chaque annonce.' })}
              {company('whatsapp', 'WhatsApp', { inputMode: 'numeric', placeholder: '33612345678', hint: 'Chiffres seulement, indicatif du pays sans le 0 (ex. 33612345678). Vide : le bouton WhatsApp n’est pas affiché.' })}
              {company('email', 'E-mail de contact', { type: 'email', inputMode: 'email', hint: 'Affiché sur le site. Reçoit les notifications si la liste ci-dessous est vide.' })}
              <div className="hidden sm:block" />
              {company('mapsUrl', 'Lien Google Maps', { type: 'url', inputMode: 'url', placeholder: 'https://maps.app.goo.gl/…', hint: 'Bouton « Itinéraire » de la page Agence.' })}
              {company('googleReviewUrl', 'Lien « laisser un avis » Google', {
                type: 'url',
                inputMode: 'url',
                placeholder: 'https://g.page/r/…/review',
                hint: 'Envoyé aux clients quelques jours après la livraison pour qu’ils laissent un avis.',
              })}
            </div>
            <div className="mt-6">
              <EmailList
                emails={v.company.notificationEmails}
                error={errors['company.notificationEmails']}
                onChange={(list) => up('company.notificationEmails', (x) => ({ ...x, company: { ...x.company, notificationEmails: list } }))}
              />
            </div>
          </Card>
        </Section>

        <Section id="horaires">
          <Card title="Horaires d’ouverture" icon={Clock}>
            <p className="mb-4 text-sm text-ink-2">
              Affichés sur le site tels que vous les écrivez. Ils servent aussi au statut « Ouvert / Fermé » en direct : écrivez les jours comme « Lundi – vendredi » ou « Samedi » et les heures comme « 9h30 – 19h » (ou
              « 10h – 12h30 et 14h – 18h », ou « Fermé »).
            </p>
            <HoursEditor
              rows={v.openingHours}
              errors={errors}
              onChange={(rows, key) => up(key, (x) => ({ ...x, openingHours: rows }))}
            />
            <div className="mt-4">
              {v.openingHours.length === 0 ? (
                <Note>Aucun horaire : le bloc « Horaires » et le statut « Ouvert » ne sont pas affichés sur le site.</Note>
              ) : summary ? (
                <Note tone="ok">
                  <p className="mb-1 flex items-center gap-2 font-bold">
                    <CheckCircle2 className="size-4" aria-hidden /> Horaires compris par le site
                  </p>
                  <ul className="ml-6 list-disc">
                    {summary.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </Note>
              ) : (
                <Note tone="warn">
                  <p className="flex items-center gap-2 font-bold">
                    <CircleAlert className="size-4" aria-hidden /> Statut « Ouvert » non affiché
                  </p>
                  <p className="mt-1">Au moins une ligne n’est pas comprise (signalée ci-dessus). Les horaires restent affichés tels quels, mais le site n’indique pas s’il est ouvert en ce moment.</p>
                </Note>
              )}
            </div>
            <p className="mt-3 text-xs text-ink-3">
              Les fermetures exceptionnelles (congés, jours fériés) et les créneaux de rendez-vous se règlent dans{' '}
              <Link href="/gestion/creneaux" className="font-bold text-accent hover:underline">
                Créneaux de rendez-vous
              </Link>
              .
            </p>
          </Card>
        </Section>

        <Section id="reseaux">
          <Card title="Réseaux sociaux" icon={Share2}>
            <div className="grid gap-4 sm:grid-cols-3">
              {(['facebook', 'instagram', 'tiktok'] as const).map((k) => {
                const key = `social.${k}`
                return (
                  <F key={k} id={fid(key)} text={{ facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok' }[k]} error={errors[key]}>
                    <input
                      {...errAria(fid(key), errors[key])}
                      type="text"
                      inputMode="url"
                      autoCapitalize="none"
                      spellCheck={false}
                      className={field}
                      value={v.social[k]}
                      placeholder={k === 'facebook' ? 'https://www.facebook.com/…' : '@lease_auto ou le lien'}
                      onChange={(e) => up(key, (x) => ({ ...x, social: { ...x.social, [k]: e.target.value } }))}
                    />
                  </F>
                )
              })}
            </div>
            <p className="mt-3 text-xs text-ink-3">
              Collez le lien de la page ou le nom du compte (@…) : il est complété tout seul. Les liens apparaissent dans le pied de page de tout le site et dans la section des avis. Un réseau laissé vide n’est pas affiché.
            </p>
          </Card>
        </Section>

        <Section id="financement">
          <Card title="Financement" icon={Landmark}>
            <div className="space-y-2 text-sm text-ink-2">
              <p>Ces taux alimentent le simulateur, les mensualités « dès … €/mois » des annonces et l’exemple représentatif affiché sous chaque offre chiffrée.</p>
              <p className="text-xs text-ink-3">Les mensualités d’une annonce existante sont recalculées quand sa fiche est enregistrée de nouveau.</p>
            </div>
            {!anyRate && (
              <Note tone="warn" className="mt-4">
                Aucune formule active n’a de taux : le simulateur affiche « Simulation personnalisée » et invite le visiteur à demander une simulation à un conseiller.
              </Note>
            )}
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {FORMULA_KEYS.map((k) => (
                <FormulaBox
                  key={k}
                  k={k}
                  value={v.financing[k]}
                  errors={errors}
                  onChange={(name, val) => up(`financing.${k}.${name}`, (x) => ({ ...x, financing: { ...x.financing, [k]: { ...x.financing[k], [name]: val } } }))}
                />
              ))}
            </div>

            <div className="mt-6">
              <F
                id={fid('financing.legalNotice')}
                text="Mention obligatoire du crédit"
                error={errors['financing.legalNotice']}
                hint="Affichée sous le simulateur et sous toute offre chiffrée."
              >
                <textarea
                  {...errAria(fid('financing.legalNotice'), errors['financing.legalNotice'])}
                  rows={2}
                  className={field}
                  value={v.financing.legalNotice}
                  onChange={(e) => up('financing.legalNotice', (x) => ({ ...x, financing: { ...x.financing, legalNotice: e.target.value } }))}
                />
              </F>
              {v.financing.legalNotice.trim() !== LEGAL_FR && (
                <Note className="mt-2">
                  En France, le texte prévu par le Code de la consommation (article L312-5) est : « {LEGAL_FR} »{' '}
                  <button
                    type="button"
                    className="font-bold text-accent hover:underline"
                    onClick={() => up('financing.legalNotice', (x) => ({ ...x, financing: { ...x.financing, legalNotice: LEGAL_FR } }))}
                  >
                    Utiliser ce texte
                  </button>
                </Note>
              )}
            </div>
          </Card>
        </Section>

        <Section id="delais">
          <Card title="Délais et automatisations" icon={Timer}>
            <div className="grid gap-4 sm:grid-cols-2">
              <RetentionInput
                k="soldVisibleDays"
                text="Affichage des véhicules vendus (jours)"
                hint="Un véhicule vendu reste en ligne avec le badge « Vendu » pendant ce délai, puis il est retiré du site automatiquement."
                value={v.retention.soldVisibleDays}
                error={errors['retention.soldVisibleDays']}
                onChange={(n) => up('retention.soldVisibleDays', (x) => ({ ...x, retention: { ...x.retention, soldVisibleDays: n } }))}
              />
              <RetentionInput
                k="documentsDays"
                text="Conservation des justificatifs (jours)"
                hint="Les pièces envoyées par les clients sont supprimées après ce délai. Ce chiffre est repris dans la politique de confidentialité."
                value={v.retention.documentsDays}
                error={errors['retention.documentsDays']}
                onChange={(n) => up('retention.documentsDays', (x) => ({ ...x, retention: { ...x.retention, documentsDays: n } }))}
              />
              <RetentionInput
                k="internalReminderHours"
                text="Relance de l’équipe après (heures)"
                hint="Une demande restée « Nouvelle » plus longtemps déclenche un e-mail de rappel aux adresses des notifications."
                value={v.retention.internalReminderHours}
                error={errors['retention.internalReminderHours']}
                onChange={(n) => up('retention.internalReminderHours', (x) => ({ ...x, retention: { ...x.retention, internalReminderHours: n } }))}
              />
              <RetentionInput
                k="reviewRequestDays"
                text="Demande d’avis après la livraison (jours)"
                hint="Le client reçoit alors un e-mail l’invitant à laisser un avis Google (lien ci-dessus, dans Coordonnées)."
                value={v.retention.reviewRequestDays}
                error={errors['retention.reviewRequestDays']}
                onChange={(n) => up('retention.reviewRequestDays', (x) => ({ ...x, retention: { ...x.retention, reviewRequestDays: n } }))}
              />
            </div>
          </Card>
        </Section>

        <Section id="mentions">
          <Card title="Mentions légales" icon={Scale}>
            <p className="mb-4 text-sm text-ink-2">Laissez un texte vide pour afficher la version de base, rédigée automatiquement à partir des coordonnées ci-dessus.</p>
            <div className="space-y-6">
              {(
                [
                  ['legalNotice', 'Mentions légales', '/mentions-legales'],
                  ['privacyPolicy', 'Politique de confidentialité', '/confidentialite'],
                  ['terms', 'Conditions générales', '/conditions-generales'],
                ] as const
              ).map(([k, title, href]) => (
                <div key={k}>
                  <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                    <label htmlFor={fid(`legal.${k}`)} className="text-xs font-bold text-ink-2">
                      {title}
                    </label>
                    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline">
                      Voir la page <ExternalLink className="size-3" aria-hidden />
                      <span className="sr-only"> (nouvel onglet)</span>
                    </a>
                  </div>
                  <MarkdownEditor
                    id={fid(`legal.${k}`)}
                    rows={8}
                    value={legal[k]}
                    placeholder="Vide : texte de base généré automatiquement."
                    onChange={(text) => {
                      setLegal((l) => ({ ...l, [k]: text }))
                      setDirty(true)
                    }}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Section>

        <div className="flex justify-end pb-6">
          <button type="submit" className={btn.primary} disabled={pending}>
            Enregistrer les réglages
          </button>
        </div>
      </div>

      <Toast message={toast} />
    </form>
  )
}

/** Ancre de section, décalée pour ne pas passer sous les barres collantes. */
function Section({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div id={id} className="scroll-mt-36">
      {children}
    </div>
  )
}

/** Liste d'e-mails qui reçoivent les notifications internes. */
function EmailList({ emails, error, onChange }: { emails: string[]; error?: string; onChange: (list: string[]) => void }) {
  const [draft, setDraft] = useState('')
  const [draftError, setDraftError] = useState('')
  const id = fid('company.notificationEmails')

  const add = () => {
    const m = draft.trim().toLowerCase()
    if (!m) return
    if (!isEmail(m)) return setDraftError('Adresse e-mail non valable.')
    if (emails.some((x) => x.toLowerCase() === m)) return setDraftError('Cette adresse est déjà dans la liste.')
    onChange([...emails, m])
    setDraft('')
    setDraftError('')
  }

  return (
    <fieldset>
      <legend className="mb-1 text-xs font-bold text-ink-2">E-mails qui reçoivent les notifications</legend>
      <p className="mb-3 text-xs text-ink-3">Nouvelles demandes, rendez-vous, relances internes. Liste vide : les notifications partent à l’e-mail de contact.</p>
      {emails.length > 0 && (
        <ul className="mb-3 grid gap-2 sm:grid-cols-2">
          {emails.map((m, i) => (
            <li key={i} className="flex items-center gap-2">
              <label htmlFor={`${id}-${i}`} className="sr-only">
                E-mail {i + 1}
              </label>
              <input id={`${id}-${i}`} type="email" className={field} value={m} onChange={(e) => onChange(emails.map((x, k) => (k === i ? e.target.value : x)))} />
              <button
                type="button"
                onClick={() => onChange(emails.filter((_, k) => k !== i))}
                className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line text-accent hover:bg-accent-soft"
                aria-label={`Retirer ${m || `l’e-mail ${i + 1}`}`}
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        <label htmlFor={id} className="sr-only">
          Nouvelle adresse
        </label>
        <input
          {...errAria(id, error || draftError)}
          type="email"
          inputMode="email"
          className={`${field} min-w-0 flex-1`}
          value={draft}
          placeholder="prenom@lease-auto.fr"
          onChange={(e) => {
            setDraft(e.target.value)
            setDraftError('')
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
        />
        <button type="button" className={btn.ghost} onClick={add}>
          <Plus className="size-4" aria-hidden /> Ajouter
        </button>
      </div>
      {(error || draftError) && (
        <p id={`${id}-error`} className="mt-1 text-xs font-semibold text-accent">
          {draftError || error}
        </p>
      )}
    </fieldset>
  )
}

/** Lignes d'horaires : jours + heures, avec indication « compris / non compris » par ligne. */
function HoursEditor({ rows, errors, onChange }: { rows: SettingsInput['openingHours']; errors: FieldErrors; onChange: (rows: SettingsInput['openingHours'], key: string) => void }) {
  const set = (i: number, k: 'days' | 'hours', val: string) => onChange(rows.map((r, j) => (j === i ? { ...r, [k]: val } : r)), `openingHours.${i}.${k}`)
  const move = (i: number, d: -1 | 1) => {
    const next = [...rows]
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    onChange(next, 'openingHours')
  }
  return (
    <div id={fid('openingHours')} tabIndex={-1}>
      {rows.length > 0 && (
        <ul className="mb-3 space-y-3">
          {rows.map((r, i) => {
            const ok = rowUnderstood(r)
            const dk = `openingHours.${i}.days`
            const hk = `openingHours.${i}.hours`
            return (
              <li key={r.id ?? `new-${i}`} className="rounded-xl border border-line p-3">
                <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-start">
                  <F id={fid(dk)} text="Jours" error={errors[dk]}>
                    <input {...errAria(fid(dk), errors[dk])} className={field} value={r.days} placeholder="Lundi – vendredi" onChange={(e) => set(i, 'days', e.target.value)} />
                  </F>
                  <F id={fid(hk)} text="Horaires" error={errors[hk]}>
                    <input {...errAria(fid(hk), errors[hk])} className={field} value={r.hours} placeholder="9h30 – 19h" onChange={(e) => set(i, 'hours', e.target.value)} />
                  </F>
                  <div className="flex gap-1 sm:pt-6">
                    <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="flex size-10 items-center justify-center rounded-xl border border-line text-ink-2 hover:bg-soft disabled:opacity-40" aria-label={`Monter la ligne ${i + 1}`}>
                      <ArrowUp className="size-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      disabled={i === rows.length - 1}
                      onClick={() => move(i, 1)}
                      className="flex size-10 items-center justify-center rounded-xl border border-line text-ink-2 hover:bg-soft disabled:opacity-40"
                      aria-label={`Descendre la ligne ${i + 1}`}
                    >
                      <ArrowDown className="size-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange(rows.filter((_, j) => j !== i), 'openingHours')}
                      className="flex size-10 items-center justify-center rounded-xl border border-line text-accent hover:bg-accent-soft"
                      aria-label={`Retirer la ligne ${i + 1}`}
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </div>
                </div>
                {(r.days.trim() || r.hours.trim()) && (
                  <p className={`mt-2 flex items-center gap-1.5 text-xs font-semibold ${ok ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {ok ? <CheckCircle2 className="size-3.5" aria-hidden /> : <CircleAlert className="size-3.5" aria-hidden />}
                    {ok ? 'Ligne comprise.' : 'Ligne non comprise : écrivez les jours en toutes lettres et les heures comme « 9h30 – 19h ».'}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {errors.openingHours && <p className="mb-2 text-xs font-semibold text-accent">{errors.openingHours}</p>}
      <button type="button" className={`${btn.ghost} ${btn.small}`} onClick={() => onChange([...rows, { days: '', hours: '' }], 'openingHours')}>
        <Plus className="size-3.5" aria-hidden /> Ajouter une ligne
      </button>
    </div>
  )
}

/** Une formule de financement. */
function FormulaBox({ k, value: f, errors, onChange }: { k: FormulaKey; value: FormulaInput; errors: FieldErrors; onChange: (name: keyof FormulaInput, val: FormulaInput[keyof FormulaInput]) => void }) {
  const p = `financing.${k}`
  const num = (name: keyof FormulaInput, text: string, opts: { step?: string; hint?: string; suffix?: string } = {}) => {
    const key = `${p}.${name}`
    return (
      <F id={fid(key)} text={text} hint={opts.hint} error={errors[key]}>
        <input
          {...errAria(fid(key), errors[key])}
          type="number"
          inputMode={opts.step ? 'decimal' : 'numeric'}
          step={opts.step ?? '1'}
          min={0}
          className={field}
          value={(f[name] as number | null) ?? ''}
          onChange={(e) => onChange(name, toNum(e.target.value))}
        />
      </F>
    )
  }
  const { title, text } = FORMULA_TITLES[k]
  const noRate = f.enabled && f.annualRate == null
  const noExample = f.enabled && !f.representativeExample.trim() && (f.annualRate == null || (k !== 'lld' && f.taeg == null) || !f.defaultMonths)

  return (
    <fieldset className={`rounded-xl border p-4 ${f.enabled ? 'border-line' : 'border-dashed border-line bg-soft/60'}`}>
      <legend className="sr-only">{title}</legend>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-lg font-black text-primary">{title}</p>
          <p className="text-xs text-ink-3">{text}</p>
        </div>
        <label className="flex items-center gap-2 text-xs font-bold text-primary">
          <input type="checkbox" className="size-4 accent-accent" checked={f.enabled} onChange={(e) => onChange('enabled', e.target.checked)} />
          Proposée
        </label>
      </div>
      {!f.enabled ? (
        <p className="text-sm text-ink-3">Formule masquée : ni simulateur ni mensualité sur les annonces.</p>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {num('annualRate', 'Taux débiteur (%)', { step: '0.01' })}
            {num('taeg', 'TAEG (%)', { step: '0.01' })}
          </div>
          {noRate && (
            <Note tone="warn" className="text-xs!">
              Sans taux, cette formule n’apparaît pas dans le simulateur, et les mensualités des annonces sont calculées à 0 %. Indiquez un taux, ou décochez « Proposée ».
            </Note>
          )}
          <div className="grid grid-cols-3 gap-3">
            {num('minMonths', 'Durée min')}
            {num('maxMonths', 'Durée max')}
            {num('defaultMonths', 'Affichée')}
          </div>
          <p className="-mt-1 text-xs text-ink-3">En mois. « Affichée » sert au calcul de la mensualité « dès … €/mois ».</p>
          <div className="grid grid-cols-2 gap-3">
            {num('defaultDepositPercent', 'Apport (% du prix)', { step: '0.5' })}
            {k !== 'credit' && num('residualPercent', 'Valeur résiduelle (%)', { step: '0.5' })}
          </div>
          <F id={fid(`${p}.representativeExample`)} text="Exemple représentatif" hint="Vide : texte calculé automatiquement avec ces taux, pour un véhicule de 20 000 €.">
            <textarea
              id={fid(`${p}.representativeExample`)}
              rows={4}
              className={`${field} text-xs`}
              value={f.representativeExample}
              onChange={(e) => onChange('representativeExample', e.target.value)}
            />
          </F>
          {noExample && (
            <Note tone="warn" className="text-xs!">
              Aucun exemple représentatif ne peut être affiché (taux, TAEG ou durée manquant). La loi l’exige dès qu’une mensualité est annoncée : complétez les taux ou saisissez le texte.
            </Note>
          )}
        </div>
      )}
    </fieldset>
  )
}

function RetentionInput({ k, text, hint, value, error, onChange }: { k: string; text: string; hint: string; value: number | null; error?: string; onChange: (n: number | null) => void }) {
  const id = fid(`retention.${k}`)
  return (
    <F id={id} text={text} hint={hint} error={error}>
      <input {...errAria(id, error)} type="number" inputMode="numeric" min={0} step="1" className={field} value={value ?? ''} onChange={(e) => onChange(toNum(e.target.value))} />
    </F>
  )
}
