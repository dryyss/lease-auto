// Résultat des actions serveur de la console, et message d'erreur lisible à partir d'une erreur Payload.

export type Result = { ok: true } | { ok: false; error: string }

export const fail = (error: string): Result => ({ ok: false, error })

export function errorMessage(err: unknown): string {
  console.error('[gestion]', err)
  const e = err as { status?: number; message?: string; data?: { errors?: { message?: string }[] } } | null
  if (e?.status === 403 || /forbidden|not allowed/i.test(e?.message ?? '')) return 'Vous n’avez pas les droits pour faire cela.'
  const first = e?.data?.errors?.[0]?.message
  if (first) return first
  return 'L’enregistrement a échoué. Réessayez dans un instant.'
}

/** Texte d'un champ de formulaire, nettoyé et borné. */
export const text = (form: FormData, name: string, max = 200) => String(form.get(name) ?? '').trim().slice(0, max)

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)
export const isPhone = (s: string) => s.replace(/\D/g, '').length >= 9
