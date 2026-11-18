'use client'

import { Check, CheckCheck, ExternalLink, FileText, Loader2, Trash2, Upload } from 'lucide-react'
import { useId, useRef, useState } from 'react'

import { deleteDocument, setDocumentsComplete, uploadDocuments } from '@/app/(gestion)/gestion/demandes/actions'
import { compressImage } from '@/components/forms/Form'
import { Badge, btn, Card } from '@/components/gestion/ui'
import { DOCUMENT_KIND_LABELS, fmtDateTime } from '@/lib/gestion/labels'
import { BUSINESS_DOCS, HOSTED_DOCS, isBusinessProfile, PERSONAL_DOCS, type RequiredDoc } from '@/lib/required-documents'
import { MAX_TOTAL_BYTES } from '@/lib/uploads'

import { fileUrl } from './format'
import { ErrorText, Modal, ModalFooter } from './Modal'
import { useAction } from './useAction'

export type DocFile = { id: number; filename: string; kind: string | null; createdAt: string }

/**
 * Pièces du dossier : liste attendue selon le profil, fichiers reçus pour chaque pièce, dépôt par l'équipe.
 * Plusieurs pièces partagent parfois le même type (« Autre ») : on les regroupe sur une seule ligne.
 */
export function DocumentsPanel({ requestId, financing, profile, missing, files, canDelete }: {
  requestId: number
  financing: boolean
  profile: string | null
  missing: boolean
  files: DocFile[]
  canDelete: boolean
}) {
  const [hosted, setHosted] = useState(false)
  const hostedId = useId()
  const business = isBusinessProfile(profile)
  const expected: RequiredDoc[] = financing ? (business ? BUSINESS_DOCS : [...PERSONAL_DOCS, ...(hosted ? HOSTED_DOCS : [])]) : []

  // Une ligne par type de pièce, dans l'ordre de la liste attendue.
  const rows = new Map<string, string[]>()
  for (const d of expected) if (d.kind) rows.set(d.kind, [...(rows.get(d.kind) ?? []), d.label])
  const offline = expected.filter((d) => !d.kind)
  const others = files.filter((f) => !f.kind || !rows.has(f.kind))

  return (
    <Card
      title="Pièces"
      icon={FileText}
      padded={false}
      action={financing ? <CompleteToggle id={requestId} missing={missing} /> : undefined}
    >
      {financing && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3 text-sm">
          <span className="text-ink-2">
            {business ? 'Liste « indépendant ou société ».' : 'Liste « particulier ».'}{' '}
            {missing ? <Badge className="bg-amber-100 text-amber-800">Pièces manquantes</Badge> : <Badge className="bg-emerald-100 text-emerald-800">Dossier complet</Badge>}
          </span>
          {!business && (
            <label htmlFor={hostedId} className="flex cursor-pointer items-center gap-2 font-semibold text-primary">
              <input id={hostedId} type="checkbox" checked={hosted} onChange={(e) => setHosted(e.target.checked)} className="size-4 accent-accent" />
              Le client est hébergé
            </label>
          )}
        </div>
      )}
      <ul className="divide-y divide-line">
        {[...rows].map(([kind, labels]) => (
          <DocRow key={kind} requestId={requestId} kind={kind} labels={labels} files={files.filter((f) => f.kind === kind)} canDelete={canDelete} />
        ))}
        {offline.map((d) => (
          <li key={d.label} className="flex gap-3 px-5 py-3.5 text-sm">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-soft text-ink-3">
              <FileText className="size-4" aria-hidden />
            </span>
            <span>
              <span className="block font-bold text-primary">{d.label}</span>
              <span className="block text-xs text-ink-3">{d.note ?? 'À demander au client, pas de fichier à déposer.'}</span>
            </span>
          </li>
        ))}
        {(others.length > 0 || !rows.has('other')) && (
          <DocRow
            requestId={requestId}
            kind="other"
            labels={[financing ? 'Autres fichiers, non classés' : 'Fichiers du dossier']}
            files={others}
            canDelete={canDelete}
            optional
          />
        )}
      </ul>
    </Card>
  )
}

function CompleteToggle({ id, missing }: { id: number; missing: boolean }) {
  const { pending, error, run } = useAction()
  return (
    <span className="flex flex-col items-end gap-1">
      <button type="button" disabled={pending} onClick={() => void run(() => setDocumentsComplete(id, missing))} className={`${missing ? btn.dark : btn.ghost} ${btn.small}`}>
        {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : missing && <CheckCheck className="size-3.5" aria-hidden />}
        {pending ? 'En cours…' : missing ? 'Dossier complet' : 'Marquer incomplet'}
      </button>
      <ErrorText>{error}</ErrorText>
    </span>
  )
}

function DocRow({ requestId, kind, labels, files, canDelete, optional = false }: {
  requestId: number
  kind: string
  labels: string[]
  files: DocFile[]
  canDelete: boolean
  optional?: boolean
}) {
  const { pending, error, setError, run } = useAction()
  const input = useRef<HTMLInputElement>(null)
  const received = files.length > 0

  const send = async (list: FileList | null) => {
    if (!list?.length) return
    const form = new FormData()
    form.set('request', String(requestId))
    form.set('kind', kind)
    let total = 0
    for (const f of Array.from(list)) {
      const file = await compressImage(f)
      total += file.size
      form.append('files', file)
    }
    if (input.current) input.current.value = ''
    if (total > MAX_TOTAL_BYTES) return setError('Fichiers trop lourds (4 Mo au total). Envoyez-les en plusieurs fois.')
    await run(() => uploadDocuments(form))
  }

  return (
    <li className="flex flex-wrap gap-3 px-5 py-3.5 sm:flex-nowrap">
      <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${received ? 'bg-emerald-100 text-emerald-700' : optional ? 'bg-soft text-ink-3' : 'bg-amber-100 text-amber-700'}`}>
        {received ? <Check className="size-4" aria-hidden /> : <Upload className="size-4" aria-hidden />}
      </span>
      <div className="min-w-0 flex-1 text-sm">
        {labels.map((l, i) => (
          <span key={l} className={`block ${i === 0 ? 'font-bold text-primary' : 'text-ink-2'}`}>
            {l}
          </span>
        ))}
        {!received && !optional && <span className="block text-xs text-amber-700">Pas encore reçue.</span>}
        {files.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {files.map((f) => (
              <FileLine key={f.id} file={f} canDelete={canDelete} showKind={optional} />
            ))}
          </ul>
        )}
        <ErrorText>{error}</ErrorText>
      </div>
      <label className={`${btn.ghost} ${btn.small} h-fit shrink-0 cursor-pointer focus-within:ring-3 focus-within:ring-accent/30 ${pending ? 'pointer-events-none opacity-60' : ''}`}>
        {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Upload className="size-3.5" aria-hidden />}
        {pending ? 'Envoi…' : 'Ajouter'}
        <input
          ref={input}
          type="file"
          accept="application/pdf,image/*"
          multiple
          className="sr-only"
          disabled={pending}
          onChange={(e) => void send(e.target.files)}
          aria-label={`Ajouter un fichier : ${labels[0]}`}
        />
      </label>
    </li>
  )
}

function FileLine({ file, canDelete, showKind }: { file: DocFile; canDelete: boolean; showKind: boolean }) {
  const { pending, error, setError, run } = useAction()
  const [open, setOpen] = useState(false)
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-soft px-3 py-2 text-xs">
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-primary" title={file.filename}>
          {file.filename}
        </span>
        <span className="text-ink-3">
          {showKind && file.kind ? `${DOCUMENT_KIND_LABELS[file.kind] ?? file.kind} · ` : ''}reçu le {fmtDateTime(file.createdAt)}
        </span>
      </span>
      <a href={fileUrl(file.filename)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-primary hover:text-accent">
        Voir <ExternalLink className="size-3" aria-hidden />
        <span className="sr-only">(nouvel onglet)</span>
      </a>
      {canDelete && (
        <>
          <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1 font-bold text-ink-3 hover:text-accent">
            <Trash2 className="size-3" aria-hidden /> Supprimer
          </button>
          <Modal
            open={open}
            onClose={() => {
              setOpen(false)
              setError('')
            }}
            title="Supprimer ce fichier ?"
          >
            <p className="text-sm text-ink-2">
              « {file.filename} » sera supprimé définitivement. Le client devra le renvoyer si vous en avez encore besoin.
            </p>
            <ModalFooter
              error={error}
              pending={pending}
              onCancel={() => setOpen(false)}
              submitLabel="Supprimer"
              tone="danger"
              submitType="button"
              onSubmit={async () => {
                if (await run(() => deleteDocument(file.id))) setOpen(false)
              }}
            />
          </Modal>
        </>
      )}
    </li>
  )
}
