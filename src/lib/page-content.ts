// Textes de fond des pages publiques. Textes de départ, à relire et valider par Lease Auto.
// Aucun chiffre ni engagement ici qui ne figure déjà ailleurs sur le site (48 h, garantie 12 mois, livraison France).

export type Item = { title: string; text: string }
export type QA = { q: string; a: string }

/** Comparatif des trois formules (pages financement et simulateur). */
export const COMPARE_ROWS: { label: string; loa: string | boolean; lld: string | boolean; credit: string | boolean }[] = [
  { label: 'Propriétaire du véhicule', loa: 'En fin de contrat, si vous levez l’option', lld: false, credit: 'Dès la livraison' },
  { label: 'Mensualité', loa: 'Plutôt basse', lld: 'La plus basse en général', credit: 'Plus élevée, mais vous remboursez tout le prix' },
  { label: 'Apport', loa: 'Facultatif', lld: 'Facultatif', credit: 'Facultatif' },
  { label: 'Kilométrage limité', loa: true, lld: true, credit: false },
  { label: 'Revente à gérer', loa: 'Non, si vous restituez', lld: false, credit: 'Oui, si vous changez de véhicule' },
  { label: 'Durée', loa: '12 à 84 mois', lld: '24 à 60 mois', credit: '12 à 72 mois' },
  { label: 'Délai de rétractation de 14 jours', loa: true, lld: 'Selon le contrat', credit: true },
  { label: 'Idéal pour', loa: 'Changer de voiture tous les 3 à 4 ans', lld: 'Pros, VTC, budget fixe', credit: 'Garder longtemps son véhicule' },
]

/** Parcours d'achat chez Lease Auto (pages financement et demande). */
export const PURCHASE_STEPS: Item[] = [
  { title: 'Vous choisissez', text: 'Un véhicule de notre stock, contrôlé et garanti 12 mois. Vous pouvez l’essayer à l’agence avant de vous décider.' },
  { title: 'Nous montons le dossier', text: 'Vous envoyez vos justificatifs en ligne. Un conseiller vérifie le dossier et le présente à nos partenaires financiers.' },
  { title: 'Vous recevez la réponse', text: 'Une fois le dossier complet, un conseiller vous présente la réponse et vous explique l’offre ligne par ligne avant toute signature.' },
  { title: 'Vous prenez la route', text: 'Retrait à l’agence d’Épinay-sur-Seine ou livraison partout en France, avec la carte grise et la garantie 12 mois.' },
]

/** Pièces demandées pour un financement (FAQ, pages financement, guide). */
export const DOCUMENTS: Item[] = [
  { title: 'Salarié', text: 'Pièce d’identité recto verso, justificatif de domicile de moins de 3 mois, 3 derniers bulletins de salaire, dernier avis d’imposition et RIB.' },
  { title: 'Indépendant ou VTC', text: 'Pièce d’identité, extrait INSEE ou avis SIREN, attestation URSSAF de moins de 3 mois, 3 derniers relevés bancaires, dernier avis d’imposition et RIB.' },
  { title: 'Société', text: 'Pièce d’identité du gérant, Kbis de moins de 3 mois, statuts à jour, liasses fiscales des deux derniers exercices et RIB de la société.' },
]

export const TRADE_IN = {
  steps: [
    { title: 'Décrivez votre véhicule', text: 'Marque, modèle, année, kilométrage et quelques photos : le formulaire prend deux minutes.' },
    { title: 'Recevez une estimation', text: 'Un conseiller étudie votre véhicule et vous envoie une estimation sous 48 h, sans engagement.' },
    { title: 'Faites-la confirmer', text: 'Nous vérifions le véhicule à l’agence. Si tout correspond à la description, le montant est confirmé.' },
    { title: 'Utilisez-la comme apport', text: 'Le montant vient en déduction de votre prochain véhicule, ou vous est réglé si vous vendez seulement.' },
  ] satisfies Item[],
  value: [
    { title: 'Année et kilométrage', text: 'Ce sont les deux premiers critères de la cote. Un kilométrage faible pour l’âge du véhicule est un vrai atout.' },
    { title: 'Historique d’entretien', text: 'Un carnet à jour et des factures rassurent sur l’état mécanique et font monter l’estimation.' },
    { title: 'État général', text: 'Carrosserie, intérieur, pneus, freins : les défauts visibles sont déduits du prix de remise en état.' },
    { title: 'Version et équipements', text: 'Motorisation, boîte automatique, GPS, aides à la conduite : les équipements recherchés comptent.' },
    { title: 'Marché du moment', text: 'La demande pour votre modèle et sa motorisation fait varier la cote d’un mois à l’autre.' },
    { title: 'Nombre de propriétaires', text: 'Un véhicule de première main, avec un historique clair, se revend mieux.' },
  ] satisfies Item[],
  documents: [
    { title: 'Carte grise', text: 'Le certificat d’immatriculation à votre nom. Si le véhicule est au nom d’une société ou d’un proche, prévenez-nous.' },
    { title: 'Contrôle technique', text: 'Le dernier procès-verbal si votre véhicule a plus de 4 ans. Il nous aide à affiner l’estimation.' },
    { title: 'Carnet et factures', text: 'Carnet d’entretien, factures de révision et de réparations : tout ce qui prouve le suivi du véhicule.' },
    { title: 'Doubles des clés', text: 'Un double manquant fait baisser le prix : pensez à l’apporter.' },
  ] satisfies Item[],
  faq: [
    { q: 'L’estimation est-elle gratuite et sans engagement ?', a: 'Oui. Vous recevez une estimation sans frais, et vous restez libre de l’accepter ou non. Elle sert aussi de base de discussion si vous achetez un véhicule chez nous.' },
    { q: 'Puis-je faire reprendre un véhicule encore en financement ?', a: 'Oui, c’est souvent possible. Indiquez-le dans votre demande : nous tenons compte du capital restant dû et nous nous occupons des démarches avec l’organisme financier.' },
    { q: 'Le prix annoncé peut-il changer à l’agence ?', a: 'L’estimation repose sur votre description et vos photos. Elle est confirmée après inspection du véhicule ; elle ne change que si l’état réel diffère de ce qui a été déclaré.' },
    { q: 'Faut-il acheter un véhicule chez Lease Auto pour faire reprendre le mien ?', a: 'Non. La reprise sert le plus souvent d’apport pour un nouveau véhicule, mais vous pouvez aussi simplement nous vendre le vôtre.' },
    { q: 'Mon véhicule a un défaut ou a été accidenté : puis-je demander une estimation ?', a: 'Oui. Décrivez-le honnêtement et joignez des photos des dégâts : l’estimation en tient compte, et vous évitez une mauvaise surprise à l’inspection.' },
  ] satisfies QA[],
}

export const SIMULATOR = {
  read: [
    { title: 'La mensualité', text: 'Le montant prélevé chaque mois pendant toute la durée du contrat. Elle baisse si vous augmentez l’apport ou la durée.' },
    { title: 'Le TAEG', text: 'Le taux annuel effectif global inclut les intérêts et les frais obligatoires. C’est le bon chiffre pour comparer deux offres entre elles.' },
    { title: 'Le coût total', text: 'Ce que vous payez au total, apport compris. La différence avec le prix du véhicule correspond au coût du financement.' },
    { title: 'L’option d’achat (LOA)', text: 'Le prix à payer en fin de LOA si vous voulez garder le véhicule. Il est fixé dès la signature et ne change pas.' },
  ] satisfies Item[],
  tips: [
    'Un apport, même modeste, réduit la mensualité et le coût total. Le montant d’une reprise peut servir d’apport.',
    'Allonger la durée baisse la mensualité mais augmente le coût total : choisissez la durée la plus courte que votre budget permet.',
    'En LOA et en LLD, choisissez un kilométrage annuel réaliste. Un dépassement est facturé en fin de contrat.',
    'La simulation calcule des montants exacts hors assurance facultative. L’offre définitive dépend de votre dossier et de l’accord de l’organisme financier.',
  ],
  faq: [
    { q: 'La simulation m’engage-t-elle ?', a: 'Non. Elle est gratuite, anonyme et sans engagement. Pour obtenir une offre personnalisée, faites une demande de financement en ligne.' },
    { q: 'Pourquoi mon offre finale peut-elle différer de la simulation ?', a: 'Le taux définitif dépend de votre profil (revenus, charges, ancienneté professionnelle) et de l’organisme financier. Nous vous présentons l’offre exacte avant toute signature.' },
    { q: 'Puis-je simuler sans avoir choisi de véhicule ?', a: 'Oui. Saisissez un prix approchant pour connaître votre budget, puis filtrez le stock par mensualité.' },
    { q: 'Le financement est-il possible pour un professionnel ou un VTC ?', a: 'Oui. La LLD et la LOA sont souvent les plus adaptées à un usage professionnel. Indiquez votre statut dans la demande : les justificatifs demandés ne sont pas les mêmes.' },
  ] satisfies QA[],
}

export const CONTACT = {
  reasons: [
    { title: 'Un véhicule du stock', text: 'Disponibilité, historique, essai, photos supplémentaires : donnez la référence de l’annonce et nous vous répondons.' },
    { title: 'Un financement', text: 'Une question sur la LOA, la LLD ou le crédit, ou sur votre dossier en cours : un conseiller vous rappelle.' },
    { title: 'Un rendez-vous', text: 'Pour un essai ou un passage à l’agence, réservez directement un créneau en ligne : la confirmation arrive par e-mail.' },
    { title: 'Une reprise', text: 'Pour faire estimer votre véhicule actuel, le formulaire de reprise avec photos est le plus rapide.' },
  ] satisfies Item[],
}

export const APPOINTMENT = {
  prepare: [
    { title: 'Votre permis de conduire', text: 'Il est indispensable pour un essai. Pensez aussi à une pièce d’identité.' },
    { title: 'Vos questions sur le véhicule', text: 'Historique, entretien, garantie, options : le conseiller a le dossier du véhicule sous la main.' },
    { title: 'Vos justificatifs', text: 'Si vous financez, venir avec vos pièces permet de lancer le dossier dès le rendez-vous.' },
    { title: 'Votre véhicule actuel', text: 'Venez avec si vous voulez une reprise : nous l’estimons sur place, pendant l’essai.' },
  ] satisfies Item[],
  faq: [
    { q: 'Puis-je lancer mon financement pendant le rendez-vous ?', a: 'Oui. Venez avec vos justificatifs : le conseiller monte le dossier avec vous et le transmet à nos partenaires financiers.' },
    { q: 'Puis-je annuler ou décaler mon rendez-vous ?', a: 'Oui. Répondez simplement à l’e-mail de confirmation ou appelez l’agence : nous vous proposons un autre créneau.' },
    { q: 'Le véhicule sera-t-il disponible le jour de l’essai ?', a: 'Nous vous prévenons si le véhicule est réservé entre-temps et vous proposons un modèle équivalent.' },
  ] satisfies QA[],
}

/** Compléments des pages formules : explications de fond, fin de contrat, questions propres à la formule. */
export const FORMULA_EXTRA: Record<'loa' | 'lld' | 'credit', { details: string[]; endTitle: string; end: Item[]; faq: QA[] }> = {
  loa: {
    details: [
      'La LOA, ou location avec option d’achat, est une location assortie d’une promesse de vente. Pendant toute la durée du contrat, l’organisme financier reste propriétaire du véhicule et vous en avez l’usage, comme si c’était le vôtre : vous l’assurez, vous l’entretenez et vous roulez dans la limite du kilométrage prévu.',
      'Votre loyer ne finance pas tout le prix du véhicule, seulement la partie de sa valeur que vous utilisez pendant le contrat. C’est pour cela qu’il est souvent plus bas qu’une mensualité de crédit pour le même véhicule. Le reste correspond à l’option d’achat, que vous payez seulement si vous décidez de garder la voiture.',
      'Sur un véhicule d’occasion récent, la LOA est un bon compromis : la voiture a déjà subi sa plus forte décote, le loyer reste maîtrisé, et vous gardez la liberté de décider à la fin si vous la conservez ou non.',
      'La LOA est un contrat de crédit à la consommation : l’offre précise le TAEG, le coût total et le montant de l’option d’achat, et vous disposez d’un délai de rétractation de 14 jours après la signature.',
    ],
    endTitle: 'En fin de LOA, trois possibilités',
    end: [
      { title: 'Vous l’achetez', text: 'Vous payez l’option d’achat fixée dès la signature. Le véhicule est à vous, la carte grise passe à votre nom.' },
      { title: 'Vous la rendez', text: 'Vous restituez le véhicule en bon état d’usage, dans la limite du kilométrage prévu. Rien d’autre à payer, hors usure anormale ou dépassement.' },
      { title: 'Vous changez', text: 'Vous restituez le véhicule et repartez dans un autre avec un nouveau contrat. La valeur de votre voiture peut alors servir d’apport.' },
    ],
    faq: [
      { q: 'Que se passe-t-il si je dépasse le kilométrage prévu ?', a: 'Les kilomètres en trop sont facturés au tarif indiqué dans le contrat, uniquement si vous restituez le véhicule. Si vous levez l’option d’achat, le dépassement n’est pas facturé.' },
      { q: 'Puis-je acheter le véhicule avant la fin de la LOA ?', a: 'Selon le contrat, une levée d’option anticipée est souvent possible. Le montant à payer est indiqué dans votre offre ou communiqué par l’organisme financier.' },
      { q: 'Qui s’occupe de l’entretien et de l’assurance ?', a: 'Vous. Pendant la LOA, vous assurez le véhicule tous risques en général, et vous suivez le carnet d’entretien du constructeur.' },
    ],
  },
  lld: {
    details: [
      'La LLD, ou location longue durée, est une location simple : vous payez un loyer pour utiliser le véhicule pendant une durée et un kilométrage fixés, puis vous le rendez. Il n’y a pas d’option d’achat, et la question de la revente ne se pose jamais.',
      'C’est la formule qui donne le loyer le plus bas en général, parce que vous ne payez que l’usage du véhicule. Selon l’offre, l’entretien, l’assistance ou certaines garanties peuvent être inclus dans le loyer : votre budget auto devient un montant fixe chaque mois.',
      'Pour un professionnel, une société ou un chauffeur VTC, la LLD présente un intérêt particulier : le loyer est une charge, sans immobilisation du véhicule au bilan. Les règles fiscales dépendent de votre statut et du véhicule : vérifiez-les avec votre expert-comptable.',
      'Bien choisir le kilométrage annuel est essentiel. Un forfait trop bas coûte cher en fin de contrat, un forfait trop haut augmente inutilement le loyer. Nous vous aidons à l’estimer à partir de votre usage réel.',
    ],
    endTitle: 'En fin de LLD',
    end: [
      { title: 'Un état des lieux', text: 'Le véhicule est inspecté à la restitution. L’usure normale liée à l’âge et au kilométrage n’est pas facturée.' },
      { title: 'Le solde du kilométrage', text: 'Si vous avez dépassé le forfait, les kilomètres en trop sont facturés au tarif prévu dans le contrat.' },
      { title: 'Un nouveau véhicule', text: 'Vous pouvez enchaîner sur un nouveau contrat et repartir dans un autre véhicule le jour de la restitution.' },
    ],
    faq: [
      { q: 'Puis-je acheter le véhicule à la fin d’une LLD ?', a: 'La LLD ne prévoit pas d’option d’achat. Si vous voulez pouvoir garder le véhicule, la LOA est plus adaptée.' },
      { q: 'La LLD est-elle réservée aux professionnels ?', a: 'Non. Les particuliers y ont aussi accès. Elle est simplement très utilisée par les sociétés et les VTC pour la simplicité de gestion.' },
      { q: 'Que se passe-t-il si j’arrête le contrat avant la fin ?', a: 'Une résiliation anticipée est possible mais entraîne des indemnités prévues au contrat. Parlez-nous de votre situation : un changement de véhicule ou un ajustement du kilométrage est parfois plus avantageux.' },
    ],
  },
  credit: {
    details: [
      'Le crédit affecté est un prêt destiné uniquement à l’achat d’un véhicule précis. Vous empruntez tout ou partie du prix et vous le remboursez par mensualités fixes. Dès la livraison, la carte grise est à votre nom : la voiture vous appartient.',
      'Parce que le crédit est lié à la vente, il vous protège : si la vente n’a pas lieu, le crédit est annulé, et si le crédit est refusé, la vente l’est aussi. Vous disposez d’un délai de rétractation de 14 jours après la signature de l’offre.',
      'La mensualité est plus élevée qu’un loyer de LOA, car vous remboursez la totalité du prix. En contrepartie, il n’y a ni limite de kilométrage, ni état des lieux, ni option d’achat : vous roulez comme vous voulez et revendez quand vous voulez.',
      'Le crédit auto convient particulièrement si vous gardez vos véhicules longtemps, si vous roulez beaucoup ou si vous voulez pouvoir modifier ou revendre la voiture librement.',
    ],
    endTitle: 'Pendant et après le crédit',
    end: [
      { title: 'Remboursement anticipé', text: 'Vous pouvez rembourser tout ou partie du crédit avant terme. Une indemnité peut s’appliquer, plafonnée par la loi.' },
      { title: 'Revente possible', text: 'Le véhicule est à vous : vous pouvez le revendre à tout moment, en soldant le capital restant dû.' },
      { title: 'Fin des mensualités', text: 'À la dernière échéance, il n’y a plus rien à payer ni à restituer : le véhicule est entièrement à vous.' },
    ],
    faq: [
      { q: 'Quelle différence entre un crédit affecté et un prêt personnel ?', a: 'Le prêt personnel n’est pas lié à l’achat : si la vente est annulée, vous devez quand même le rembourser. Le crédit affecté, lui, est annulé avec la vente.' },
      { q: 'Faut-il une assurance emprunteur ?', a: 'Elle est souvent proposée et parfois demandée par l’organisme financier. Elle couvre les échéances en cas de décès, d’invalidité ou d’incapacité. Son coût est indiqué dans l’offre.' },
      { q: 'Puis-je financer un véhicule sans apport ?', a: 'Oui, le financement peut couvrir 100 % du prix selon votre dossier. Un apport, ou une reprise, réduit simplement la mensualité et le coût total.' },
    ],
  },
}
