'use client'

import {
  ArrowDown,
  ArrowUp,
  CarFront,
  Eye,
  ImageOff,
  Loader2,
  Save,
  Send,
  Trash2,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useId, useState, type ReactNode } from 'react'

import {
  deleteCampaign,
  previewCampaign,
  saveCampaign,
  sendCampaignNow,
  type CampaignInput,
} from '@/app/(gestion)/gestion/newsletters/actions'
import { Dialog } from '@/components/gestion/Dialog'
import { ConfirmButton } from '@/components/gestion/medias/ConfirmButton'
import { ErrorText, safeRun } from '@/components/gestion/rendez-vous/dialog'
import { Badge, btn, Card, field, label } from '@/components/gestion/ui'
import { euro, plural } from '@/lib/gestion/labels'

import type { VehicleOption } from './load'

const MAX = 6

/** Fiche newsletter : objet, introduction, véhicules (6 au plus), aperçu, enregistrement et envoi. */
export function CampaignForm({
  initial,
  sent = false,
  options,
  recipients,
  emailOn,
}: {
  initial: CampaignInput
  sent?: boolean
  options: VehicleOption[]
  recipients: number
  emailOn: boolean
}) {
  const router = useRouter()
  const id = useId()
  const [subject, setSubject] = useState(initial.subject)
  const [intro, setIntro] = useState(initial.intro)
  const [vehicles, setVehicles] = useState<number[]>(initial.vehicles)
  const [q, setQ] = useState('')
  const [pending, setPending] = useState<'' | 'save' | 'preview'>('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const input = (): CampaignInput => ({ id: initial.id, subject, intro, vehicles })
  const dirty =
    subject !== initial.subject ||
    intro !== initial.intro ||
    vehicles.join() !== initial.vehicles.join()
  const byId = (vid: number) => options.find((o) => o.id === vid)

  const save = async () => {
    setPending('save')
    setError('')
    setSaved(false)
    const r = await safeRun(() => saveCampaign(input()))
    setPending('')
    if (!r.ok) return setError(r.error)
    if (!initial.id) return router.push(`/gestion/newsletters/${r.id}`)
    setSaved(true)
    router.refresh()
  }

  const showPreview = async () => {
    setPending('preview')
    setError('')
    const r = await safeRun(() => previewCampaign(input()))
    setPending('')
    if (!r.ok) return setError(r.error)
    setPreview(r.html)
  }

  const toggle = (vid: number) =>
    setVehicles((list) =>
      list.includes(vid)
        ? list.filter((x) => x !== vid)
        : list.length < MAX
          ? [...list, vid]
          : list,
    )
  const move = (i: number, d: -1 | 1) =>
    setVehicles((list) => {
      const next = [...list]
      const j = i + d
      if (j < 0 || j >= next.length) return list
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })

  const nq = q.trim().toLowerCase()
  const shown = options.filter(
    (o) =>
      o.online &&
      (!nq || o.title.toLowerCase().includes(nq) || (o.reference ?? '').toLowerCase().includes(nq)),
  )

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <Card title="Contenu">
          <div className="space-y-4">
            <div>
              <label htmlFor={`${id}-subject`} className={label}>
                Objet de l’e-mail (sert aussi de titre)
              </label>
              <input
                id={`${id}-subject`}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={150}
                required
                disabled={sent}
                className={field}
                placeholder="Ex. Nos nouveautés de la semaine"
              />
            </div>
            <div>
              <label htmlFor={`${id}-intro`} className={label}>
                Texte d’introduction
              </label>
              <textarea
                id={`${id}-intro`}
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                rows={5}
                maxLength={3000}
                disabled={sent}
                className={field}
                placeholder="Facultatif. Quelques phrases avant la sélection de véhicules."
              />
              <p className="mt-1 text-xs text-ink-3">
                Texte simple, en un seul paragraphe : les retours à la ligne et la mise en forme ne
                sont pas repris dans l’e-mail.
              </p>
            </div>
          </div>
        </Card>

        <Card title={`Véhicules présentés (${vehicles.length} sur ${MAX} au plus)`} icon={CarFront}>
          {vehicles.length ? (
            <ol className="mb-5 space-y-2">
              {vehicles.map((vid, i) => {
                const v = byId(vid)
                return (
                  <li
                    key={vid}
                    className="flex items-center gap-3 rounded-xl border border-line bg-white p-2"
                  >
                    <Thumb src={v?.thumb ?? null} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-primary">
                        {v?.title ?? `Véhicule n° ${vid}`}
                      </span>
                      <span className="block text-xs text-ink-3">
                        {[v?.year, v?.price != null ? euro(v.price) : null]
                          .filter(Boolean)
                          .join(' · ')}
                        {v && !v.online && (
                          <Badge className="ml-1.5 bg-amber-100 text-amber-900">
                            Plus en ligne
                          </Badge>
                        )}
                      </span>
                    </span>
                    {!sent && (
                      <span className="flex shrink-0 gap-1">
                        <IconButton label="Monter" onClick={() => move(i, -1)} disabled={i === 0}>
                          <ArrowUp className="size-4" aria-hidden />
                        </IconButton>
                        <IconButton
                          label="Descendre"
                          onClick={() => move(i, 1)}
                          disabled={i === vehicles.length - 1}
                        >
                          <ArrowDown className="size-4" aria-hidden />
                        </IconButton>
                        <IconButton label="Retirer" onClick={() => toggle(vid)}>
                          <X className="size-4" aria-hidden />
                        </IconButton>
                      </span>
                    )}
                  </li>
                )
              })}
            </ol>
          ) : (
            <p className="mb-5 text-sm text-ink-2">
              Aucun véhicule choisi. La newsletter contiendra seulement le texte et le bouton « Voir
              tout le stock ».
            </p>
          )}

          {!sent && (
            <>
              <label htmlFor={`${id}-q`} className={label}>
                Ajouter des véhicules en ligne
              </label>
              <input
                id={`${id}-q`}
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher par titre ou référence"
                className={field}
              />
              <ul className="mt-3 max-h-96 space-y-1 overflow-y-auto pr-1">
                {shown.map((o) => {
                  const on = vehicles.includes(o.id)
                  const full = !on && vehicles.length >= MAX
                  return (
                    <li key={o.id}>
                      <label
                        className={`flex cursor-pointer items-center gap-3 rounded-xl p-2 transition has-focus-visible:ring-3 has-focus-visible:ring-accent/30 ${on ? 'bg-primary/5 ring-1 ring-primary/30' : 'hover:bg-soft'} ${full ? 'cursor-not-allowed opacity-50' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          disabled={full}
                          onChange={() => toggle(o.id)}
                          className="size-4 shrink-0 accent-accent"
                        />
                        <Thumb src={o.thumb} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-primary">
                            {o.title}
                          </span>
                          <span className="block text-xs text-ink-3">
                            {[
                              o.reference && `Réf. ${o.reference}`,
                              o.year,
                              o.price != null ? euro(o.price) : null,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        </span>
                      </label>
                    </li>
                  )
                })}
                {!shown.length && (
                  <li className="p-2 text-sm text-ink-2">
                    {nq
                      ? 'Aucun véhicule en ligne ne correspond.'
                      : 'Aucun véhicule en ligne pour le moment.'}
                  </li>
                )}
              </ul>
              {vehicles.length >= MAX && (
                <p className="mt-2 text-xs font-semibold text-amber-800">
                  Six véhicules au plus : retirez-en un pour en ajouter un autre.
                </p>
              )}
            </>
          )}
        </Card>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card title={sent ? 'Newsletter envoyée' : 'Envoi'} icon={Send}>
          <div className="space-y-3">
            {!sent && (
              <p className="text-sm text-ink-2">
                Destinataires :{' '}
                <strong className="text-primary">{plural(recipients, 'abonné')}</strong> à la
                newsletter.
              </p>
            )}
            <button
              type="button"
              onClick={() => void showPreview()}
              className={`${btn.ghost} w-full`}
              disabled={!!pending}
            >
              {pending === 'preview' ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}{' '}
              Aperçu de l’e-mail
            </button>
            {!sent && (
              <>
                <button
                  type="button"
                  onClick={() => void save()}
                  className={`${btn.dark} w-full`}
                  disabled={!!pending || !subject.trim()}
                  aria-busy={pending === 'save'}
                >
                  {pending === 'save' ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <Save className="size-4" aria-hidden />
                  )}
                  {initial.id ? 'Enregistrer le brouillon' : 'Créer le brouillon'}
                </button>
                {saved && !dirty && (
                  <p role="status" className="text-xs font-semibold text-emerald-700">
                    Brouillon enregistré.
                  </p>
                )}
                {!initial.id && (
                  <p className="text-xs text-ink-3">
                    L’envoi sera possible une fois le brouillon créé.
                  </p>
                )}
              </>
            )}
            {/* Reste monté après l'envoi : la fenêtre affiche le résultat pendant que la page passe en « Envoyée ». */}
            {initial.id && (
              <SendButton
                input={input()}
                sent={sent}
                recipients={recipients}
                emailOn={emailOn}
                disabled={!!pending || !subject.trim()}
              />
            )}
            {error && <ErrorText>{error}</ErrorText>}
          </div>
        </Card>
        {!sent && initial.id && (
          <ConfirmButton
            className={`${btn.danger} ${btn.small}`}
            icon={<Trash2 className="size-3.5" aria-hidden />}
            label="Supprimer le brouillon"
            title="Supprimer ce brouillon ?"
            cta="Supprimer le brouillon"
            run={() => deleteCampaign(initial.id!)}
            onDone={() => router.push('/gestion/newsletters')}
          >
            <p>
              Le brouillon « {initial.subject} » sera supprimé définitivement. Rien n’a été envoyé.
            </p>
          </ConfirmButton>
        )}
      </aside>

      <Dialog
        open={preview !== null}
        onClose={() => setPreview(null)}
        title="Aperçu de l’e-mail"
        wide
      >
        <p className="mb-3 text-xs text-ink-3">
          Aperçu des dernières saisies, même non enregistrées. Le lien de désinscription est inactif
          ici.
        </p>
        {preview !== null && (
          <iframe
            title="Aperçu de la newsletter"
            srcDoc={preview}
            sandbox=""
            className="h-[65vh] w-full rounded-xl border border-line bg-soft"
          />
        )}
      </Dialog>
    </div>
  )
}

function Thumb({ src }: { src: string | null }) {
  return (
    <span className="flex h-10 w-15 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-soft">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- miniature déjà optimisée par Payload
        <img src={src} alt="" className="size-full object-cover" loading="lazy" />
      ) : (
        <ImageOff className="size-4 text-ink-3" aria-hidden />
      )}
    </span>
  )
}

function IconButton({
  label: text,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={text}
      title={text}
      className="flex size-8 items-center justify-center rounded-lg text-ink-2 hover:bg-soft hover:text-primary disabled:opacity-30"
    >
      {children}
    </button>
  )
}

/** Envoi avec confirmation forte : nombre de destinataires, case à cocher, action irréversible. */
function SendButton({
  input,
  sent,
  recipients,
  emailOn,
  disabled,
}: {
  input: CampaignInput
  sent: boolean
  recipients: number
  emailOn: boolean
  disabled: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [checked, setChecked] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState<{ sentCount: number; recipients: number } | null>(null)

  const blocked = !emailOn
    ? 'L’envoi d’e-mails n’est pas branché sur ce site.'
    : !recipients
      ? 'Aucun abonné à la newsletter.'
      : ''

  const send = async () => {
    setPending(true)
    setError('')
    const r = await safeRun(() => sendCampaignNow(input))
    setPending(false)
    if (!r.ok) return setError(r.error)
    setDone({ sentCount: r.sentCount, recipients: r.recipients })
    router.refresh()
  }

  const close = () => setOpen(false)

  return (
    <>
      {!sent && (
        <>
          <button
            type="button"
            className={`${btn.primary} w-full`}
            disabled={disabled || !!blocked}
            title={blocked || undefined}
            onClick={() => {
              setChecked(false)
              setError('')
              setDone(null)
              setOpen(true)
            }}
          >
            <Send className="size-4" aria-hidden /> Envoyer la newsletter…
          </button>
          {blocked && (
            <p className="text-xs font-semibold text-amber-800">{blocked} Envoi impossible.</p>
          )}
        </>
      )}

      <Dialog
        open={open}
        onClose={close}
        title={done ? 'Newsletter envoyée' : 'Envoyer la newsletter ?'}
      >
        {done ? (
          <div className="space-y-3 text-sm text-ink-2">
            <p role="status" className="font-semibold text-emerald-700">
              Envoyée à {plural(done.sentCount, 'abonné')}
              {done.sentCount < done.recipients ? ` sur ${done.recipients}` : ''}.
            </p>
            {done.sentCount < done.recipients && (
              <p>
                Certains e-mails n’ont pas pu partir (adresse refusée ou service indisponible). Le
                détail est dans les journaux du serveur.
              </p>
            )}
            <div className="flex justify-end">
              <button type="button" className={btn.dark} onClick={close}>
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-sm text-ink-2">
            <p className="rounded-xl border border-accent/30 bg-accent-soft p-3 font-semibold text-accent-dark">
              « {input.subject} » sera envoyée maintenant à {plural(recipients, 'abonné')}. L’envoi
              ne peut pas être annulé ni recommencé.
            </p>
            <p>
              Les dernières modifications sont enregistrées au moment de l’envoi. Vérifiez l’aperçu
              avant de continuer.
            </p>
            <label className="flex items-start gap-2 font-semibold text-primary">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="mt-0.5 size-4 accent-accent"
              />
              J’ai relu l’aperçu et je confirme l’envoi à {plural(recipients, 'abonné')}.
            </label>
            {error && <ErrorText>{error}</ErrorText>}
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button type="button" className={btn.ghost} onClick={close} disabled={pending}>
                Annuler
              </button>
              <button
                type="button"
                className={btn.primary}
                onClick={() => void send()}
                disabled={!checked || pending}
                aria-busy={pending}
              >
                {pending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Send className="size-4" aria-hidden />
                )}
                {pending ? 'Envoi en cours…' : 'Envoyer maintenant'}
              </button>
            </div>
            {pending && (
              <p className="text-xs text-ink-3">
                Gardez cette page ouverte jusqu’à la fin de l’envoi.
              </p>
            )}
          </div>
        )}
      </Dialog>
    </>
  )
}
