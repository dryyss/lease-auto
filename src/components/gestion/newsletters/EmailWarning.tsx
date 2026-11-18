import { TriangleAlert } from 'lucide-react'

/** Avertissement affiché quand l'envoi d'e-mails n'est pas branché (RESEND_API_KEY absente). */
export function EmailWarning() {
  return (
    <p
      role="status"
      className="mb-5 flex items-start gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900"
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>
        L’envoi d’e-mails n’est pas branché sur ce site : la clé du service d’envoi (RESEND_API_KEY)
        n’est pas configurée. Vous pouvez préparer et prévisualiser vos newsletters, mais aucune ne
        peut partir pour le moment.
      </span>
    </p>
  )
}
