// Contrôle des fichiers envoyés par les clients (formulaires du site, « Mon espace »).
export const MAX_FILES = 10
export const MAX_TOTAL_BYTES = 4 * 1024 * 1024 // limite d'une requête sur Vercel (4,5 Mo)
export const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic']

export const DOCUMENT_KINDS = ['id', 'address', 'payslips', 'tax', 'rib', 'kbis', 'accounts', 'bank', 'other'] as const
export type DocumentKind = (typeof DOCUMENT_KINDS)[number]

/** Fichiers valides du champ, ou message d'erreur à afficher. */
export function readFiles(form: FormData, field: string): File[] | string {
  const files = form.getAll(field).filter((f): f is File => f instanceof File && f.size > 0)
  if (files.length > MAX_FILES) return `${MAX_FILES} fichiers maximum.`
  if (files.reduce((s, f) => s + f.size, 0) > MAX_TOTAL_BYTES)
    return 'Fichiers trop lourds (4 Mo au total). Envoyez-les en plusieurs fois.'
  if (files.some((f) => !ACCEPTED.includes(f.type))) return 'Formats acceptés : PDF, JPG, PNG, HEIC.'
  return files
}
