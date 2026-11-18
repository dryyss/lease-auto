// Motifs de refus d'une demande : obligatoires au passage en « Refus » (fiche et tableau de bord).
// Usage interne : le motif n'est pas envoyé au client.
export const REFUSAL_REASONS = [
  { value: 'income', label: 'Revenus insuffisants' },
  { value: 'debt', label: 'Endettement trop élevé' },
  { value: 'banking', label: 'Incidents bancaires (fichage, rejets)' },
  { value: 'seniority', label: 'Ancienneté professionnelle insuffisante' },
  { value: 'documents', label: 'Dossier incomplet, pièces non fournies' },
  { value: 'lender', label: 'Refus de l’organisme prêteur' },
  { value: 'withdrawn', label: 'Le client a renoncé' },
  { value: 'unreachable', label: 'Client injoignable' },
  { value: 'other', label: 'Autre motif' },
] as const

export type RefusalReason = (typeof REFUSAL_REASONS)[number]['value']

export const isRefusalReason = (v: unknown): v is RefusalReason => REFUSAL_REASONS.some((r) => r.value === v)

/** Message d'erreur, ou null si le motif est complet (« Autre » demande une précision). */
export function refusalProblem(reason: unknown, note: unknown): string | null {
  if (!isRefusalReason(reason)) return 'Choisissez le motif du refus.'
  if (reason === 'other' && !String(note ?? '').trim()) return 'Précisez le motif du refus.'
  return null
}

/** Motifs proposés selon le type : les motifs de crédit n'ont pas de sens pour un message, un rappel ou une reprise. */
export const reasonsFor = (type: string) =>
  type === 'financing' ? REFUSAL_REASONS : REFUSAL_REASONS.filter((r) => r.value === 'withdrawn' || r.value === 'unreachable' || r.value === 'other')
