// Pièces demandées pour l'étude d'un dossier, reprises de l'affiche de l'agence (« Documents nécessaires à l'étude du dossier »).
// `kind` = type de justificatif dans Admin → Justificatifs. Absent : pièce à fournir mais pas à déposer en ligne.

export type RequiredDoc = { label: string; kind?: 'id' | 'address' | 'payslips' | 'tax' | 'rib' | 'kbis' | 'accounts' | 'bank' | 'other'; note?: string }

export const PERSONAL_DOCS: RequiredDoc[] = [
  { label: 'Pièce d’identité (recto/verso)', kind: 'id' },
  { label: 'Facture EDF ou de téléphone de moins de 3 mois', kind: 'address' },
  { label: '3 derniers bulletins de salaire', kind: 'payslips' },
  { label: '3 derniers relevés de compte', kind: 'bank' },
  { label: 'Dernier avis d’imposition', kind: 'tax' },
  { label: 'RIB', kind: 'rib' },
  { label: 'Permis de conduire', kind: 'other' },
]

/** En plus, si le client est hébergé. */
export const HOSTED_DOCS: RequiredDoc[] = [
  { label: 'Pièce d’identité de l’hébergeur', kind: 'other' },
  { label: 'Attestation d’hébergement manuscrite', kind: 'other' },
]

export const BUSINESS_DOCS: RequiredDoc[] = [
  { label: 'Pièce d’identité du gérant ou du PDG (recto/verso)', kind: 'id' },
  { label: 'Extrait Kbis', kind: 'kbis' },
  { label: 'RIB', kind: 'rib' },
  { label: 'Dernier bilan (feuillets 1 à 8 et 11) ou liasse 2031 / 2035', kind: 'accounts' },
  { label: '3 derniers relevés de compte', kind: 'bank' },
  { label: 'Dernier avis d’imposition du gérant', kind: 'tax' },
  { label: 'Coordonnées de votre expert-comptable', note: 'À indiquer dans votre message ou par téléphone.' },
  { label: 'Apport exigé', note: 'Un apport est demandé aux indépendants et aux entreprises.' },
]

/** Profils de la demande traités comme « indépendants et entreprises ». */
export const isBusinessProfile = (profile?: string | null) => profile === 'independant' || profile === 'societe'
