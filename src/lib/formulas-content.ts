import type { Formula } from './finance'

type Content = {
  slug: string
  name: string
  title: string
  metaTitle: string
  metaDescription: string
  intro: string
  how: { title: string; text: string }[]
  pros: string[]
  forWho: string
  conditions: string[]
}

// PUB-11 : une page par formule. Textes de départ, à valider par Lease Auto.
export const FORMULAS: Record<Formula, Content> = {
  loa: {
    slug: 'loa',
    name: 'LOA',
    title: 'La LOA : roulez maintenant, décidez plus tard',
    metaTitle: 'LOA voiture d’occasion : location avec option d’achat',
    metaDescription: 'Financez votre voiture d’occasion en LOA chez Lease Auto : loyers fixes de 12 à 84 mois, option d’achat en fin de contrat. Garantie 12 mois.',
    intro:
      'La location avec option d’achat vous permet de rouler dans un véhicule d’occasion contrôlé contre un loyer mensuel fixe. En fin de contrat, vous choisissez : l’acheter au prix fixé dès le départ, ou le rendre.',
    how: [
      { title: 'Un premier loyer (facultatif)', text: 'Un apport en début de contrat fait baisser vos loyers. Il n’est pas obligatoire.' },
      { title: 'Des loyers fixes', text: 'De 12 à 84 mois, le même montant chaque mois : votre budget est maîtrisé.' },
      { title: 'Le choix final', text: 'Vous levez l’option d’achat et le véhicule est à vous, ou vous le restituez simplement.' },
    ],
    pros: ['Loyers souvent plus bas qu’un crédit', 'Aucune revente à gérer si vous rendez le véhicule', 'Option d’achat connue dès la signature', 'Accessible aux particuliers et aux professionnels'],
    forWho: 'Idéal si vous voulez une mensualité basse et garder la liberté de changer de véhicule dans quelques années.',
    conditions: ['Être majeur et résider en France', 'Justifier de revenus réguliers', 'Kilométrage annuel défini au contrat', 'Restitution en bon état d’usage, hors usure normale'],
  },
  lld: {
    slug: 'lld',
    name: 'LLD',
    title: 'La LLD : un loyer fixe, sans souci de revente',
    metaTitle: 'LLD voiture d’occasion : location longue durée',
    metaDescription: 'Location longue durée de véhicules d’occasion chez Lease Auto : loyer fixe, entretien possible, idéal pour les pros et les VTC. Garantie 12 mois.',
    intro:
      'Avec la location longue durée, vous payez un loyer fixe pour l’usage d’un véhicule pendant une durée définie, puis vous le rendez. Pas d’achat, pas de revente : vous changez de voiture quand le contrat se termine.',
    how: [
      { title: 'Durée et kilométrage', text: 'Vous choisissez la durée (24 à 60 mois) et le kilométrage annuel adaptés à votre usage.' },
      { title: 'Un loyer tout compris possible', text: 'L’entretien et l’assistance peuvent être inclus dans le loyer selon l’offre.' },
      { title: 'Restitution', text: 'En fin de contrat, vous rendez le véhicule et pouvez repartir dans un autre.' },
    ],
    pros: ['Budget auto fixe et prévisible', 'Pas de risque sur la valeur de revente', 'Loyers déductibles pour les professionnels (selon régime fiscal)', 'Formule adaptée aux VTC et aux flottes'],
    forWho: 'Idéal pour les professionnels, VTC et conducteurs qui veulent un véhicule récent sans s’occuper de la revente.',
    conditions: ['Justifier de revenus ou d’une activité (Kbis pour les sociétés)', 'Kilométrage annuel défini au contrat', 'Frais en cas de dépassement kilométrique ou de dégâts hors usure normale'],
  },
  credit: {
    slug: 'credit',
    name: 'Crédit auto',
    title: 'Le crédit auto : propriétaire dès le premier jour',
    metaTitle: 'Crédit auto voiture d’occasion : crédit affecté',
    metaDescription: 'Achetez votre voiture d’occasion à crédit chez Lease Auto : mensualités fixes de 12 à 72 mois, vous êtes propriétaire dès la livraison. Garantie 12 mois.',
    intro:
      'Avec le crédit affecté, vous achetez le véhicule et le remboursez par mensualités fixes. La carte grise est à votre nom dès la livraison : aucune limite de kilométrage, aucune restitution.',
    how: [
      { title: 'Apport ou non', text: 'Vous financez tout ou partie du prix, avec ou sans apport.' },
      { title: 'Des mensualités fixes', text: 'De 12 à 72 mois, au taux fixe indiqué dans l’offre de crédit.' },
      { title: 'Propriétaire immédiatement', text: 'Le véhicule est à vous : vous roulez autant que vous voulez et pouvez le revendre quand vous voulez.' },
    ],
    pros: ['Vous êtes propriétaire dès la livraison', 'Aucune limite de kilométrage', 'Crédit affecté : annulé si la vente n’a pas lieu', 'Remboursement anticipé possible'],
    forWho: 'Idéal si vous gardez longtemps vos véhicules ou roulez beaucoup.',
    conditions: ['Être majeur et résider en France', 'Justifier de revenus réguliers', 'Taux d’endettement compatible avec la mensualité', 'Délai de rétractation de 14 jours'],
  },
}
