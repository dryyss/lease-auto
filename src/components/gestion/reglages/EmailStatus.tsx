'use client'

import { CheckCircle2, Loader2, Mail, MailWarning, Send } from 'lucide-react'
import { useState } from 'react'

import { sendSettingsTestEmail } from '@/app/(gestion)/gestion/reglages/actions'
import { btn, Card } from '@/components/gestion/ui'

/** État des e-mails automatiques et envoi d'un e-mail de test. */
export function EmailStatus({ enabled, recipients }: { enabled: boolean; recipients: string[] }) {
  const [state, setState] = useState<'idle' | 'pending' | 'sent' | string>('idle')

  const test = async () => {
    setState('pending')
    try {
      const r = await sendSettingsTestEmail()
      setState(r.ok ? 'sent' : r.error)
    } catch {
      setState('Le serveur ne répond pas. Rechargez la page puis réessayez.')
    }
  }

  return (
    <div id="emails" className="mb-6 scroll-mt-24">
      <Card title="E-mails automatiques" icon={Mail}>
        {enabled ? (
          <p className="flex items-start gap-2 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              <strong>Branchés.</strong> Confirmations et rappels de rendez-vous, annulations, changements d’horaire, suivi des demandes et relances partent automatiquement.
            </span>
          </p>
        ) : (
          <p className="flex items-start gap-2 text-sm text-amber-900">
            <MailWarning className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              <strong>Pas encore branchés.</strong> Aucun e-mail ne part (ni au client, ni à l’équipe) tant que le service d’envoi Resend n’est pas relié au site. Tout le reste fonctionne : les e-mails partiront d’eux-mêmes dès le branchement.
            </span>
          </p>
        )}
        <p className="mt-3 text-sm text-ink-2">
          Alertes de l’équipe envoyées à : <strong className="text-primary">{recipients.length ? recipients.join(', ') : 'aucune adresse'}</strong>. Modifiable plus bas, dans « Coordonnées » (adresses de notification).
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" className={btn.ghost} onClick={test} disabled={!enabled || state === 'pending'} title={enabled ? undefined : 'Disponible une fois les e-mails branchés'}>
            {state === 'pending' ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />} Envoyer un e-mail de test
          </button>
          {state === 'sent' && (
            <span role="status" className="text-sm font-semibold text-emerald-700">
              E-mail envoyé. Vérifiez la boîte de réception (et les indésirables).
            </span>
          )}
          {state !== 'idle' && state !== 'pending' && state !== 'sent' && (
            <span role="alert" className="text-sm font-semibold text-accent">
              {state}
            </span>
          )}
        </div>
      </Card>
    </div>
  )
}
