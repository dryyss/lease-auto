// Contenus de départ (à relire et valider par Lease Auto). Usage : pnpm seed:content
// Ne remplit que ce qui est vide : ne remplace jamais un contenu déjà saisi.
import { getPayload } from 'payload'

import config from '@payload-config'

const payload = await getPayload({ config })

type Node = Record<string, unknown>
const text = (t: string, bold = false): Node => ({ type: 'text', text: t, format: bold ? 1 : 0, detail: 0, mode: 'normal', style: '', version: 1 })
const p = (t: string): Node => ({ type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr', textFormat: 0, children: [text(t)] })
const h2 = (t: string): Node => ({ type: 'heading', tag: 'h2', format: '', indent: 0, version: 1, direction: 'ltr', children: [text(t)] })
const ul = (items: string[]): Node => ({
  type: 'list',
  listType: 'bullet',
  tag: 'ul',
  start: 1,
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  children: items.map((t, i) => ({ type: 'listitem', value: i + 1, format: '', indent: 0, version: 1, direction: 'ltr', children: [text(t)] })),
})
const doc = (...children: Node[]) => ({ root: { type: 'root', format: '' as const, indent: 0, version: 1, direction: 'ltr' as const, children } }) as never

const done: string[] = []

// Horaires et créneaux de rendez-vous
const settings = await payload.findGlobal({ slug: 'settings' })
if (!settings.openingHours?.length) {
  await payload.updateGlobal({
    slug: 'settings',
    data: { openingHours: [{ days: 'Lundi – vendredi', hours: '9h30 – 19h' }, { days: 'Samedi', hours: '10h – 18h' }, { days: 'Dimanche', hours: 'Fermé' }] },
  })
  done.push('horaires (à confirmer)')
}
const agenda = await payload.findGlobal({ slug: 'agenda' })
if (!agenda.weekly?.length) {
  const weekdays = ['1', '2', '3', '4', '5'] as const
  await payload.updateGlobal({
    slug: 'agenda',
    data: {
      weekly: [
        ...weekdays.flatMap((day) => [
          { day, from: '10:00', to: '12:30' },
          { day, from: '14:00', to: '18:30' },
        ]),
        { day: '6', from: '10:00', to: '17:00' },
      ],
    },
  })
  done.push('créneaux de rendez-vous')
}

// Page « L'agence »
const agency = await payload.findGlobal({ slug: 'agency' })
if (!agency.content) {
  await payload.updateGlobal({
    slug: 'agency',
    data: {
      content: doc(
        p('Lease Auto sélectionne des véhicules d’occasion récents, contrôlés et garantis, et les rend accessibles grâce à un financement adapté à chaque profil : salariés, indépendants, VTC, sociétés.'),
        h2('Notre méthode'),
        ul([
          'Chaque véhicule est expertisé avant sa mise en vente, avec historique vérifié.',
          'Garantie de 12 mois incluse.',
          'Plusieurs partenaires financiers sollicités pour trouver la solution la plus cohérente.',
          'Dossier 100 % en ligne et réponse de principe sous 48 h ouvrées.',
          'Retrait à l’agence ou livraison partout en France.',
        ]),
        h2('Une équipe à votre écoute'),
        p('Nos conseillers vous accompagnent du choix du véhicule jusqu’à la remise des clés. Passez nous voir à Épinay-sur-Seine ou contactez-nous par téléphone ou WhatsApp.'),
      ),
    },
  })
  done.push('page agence')
}

// SEO-03 : pages locales
const locals = await payload.count({ collection: 'local-pages' })
if (locals.totalDocs === 0) {
  const zones = [
    ['Épinay-sur-Seine', 'Votre agence auto à Épinay-sur-Seine', 'Notre agence est au 42 boulevard Foch, à deux pas du centre-ville et du tramway T8.'],
    ['Saint-Denis', 'Voiture d’occasion financée à Saint-Denis', 'À une dizaine de minutes de Saint-Denis par l’A86 ou le T8.'],
    ['Paris Nord', 'Voiture d’occasion en LOA pour Paris nord', 'À 20 minutes de la porte de la Chapelle et de la porte de Clignancourt.'],
    ['Seine-Saint-Denis', 'Voiture d’occasion en Seine-Saint-Denis (93)', 'Retrait à Épinay-sur-Seine ou livraison dans tout le 93.'],
    ['Val-d’Oise', 'Voiture d’occasion dans le Val-d’Oise (95)', 'À quelques minutes d’Argenteuil, Sarcelles, Deuil-la-Barre et Montmorency.'],
  ] as const
  for (const [city, headline, distanceNote] of zones) {
    await payload.create({
      collection: 'local-pages',
      draft: false,
      data: {
        city,
        headline,
        distanceNote,
        _status: 'published',
        content: doc(
          p(`Vous habitez ${city} et cherchez une voiture d’occasion fiable avec un financement adapté ? Lease Auto propose des véhicules contrôlés et garantis 12 mois, finançables en LOA, LLD ou crédit auto.`),
          h2(`Pourquoi choisir Lease Auto près de ${city}`),
          ul([
            'Des véhicules récents, expertisés et garantis.',
            'Une réponse de principe sous 48 h ouvrées.',
            'Un dossier simple, déposé en ligne.',
            'Un essai sur rendez-vous à notre agence d’Épinay-sur-Seine.',
            `La livraison possible à ${city} et partout en France.`,
          ]),
          p('Parcourez notre stock, simulez votre mensualité et déposez votre demande en quelques minutes.'),
        ),
      },
    })
  }
  done.push('5 pages locales')
}

// PUB-18 : premiers guides
const articles = await payload.count({ collection: 'articles' })
if (articles.totalDocs === 0) {
  await payload.create({
    collection: 'articles',
    draft: false,
    data: {
      title: 'LOA ou crédit auto : comment choisir ?',
      excerpt: 'Mensualité, propriété, kilométrage, fin de contrat : les différences clés pour choisir la bonne formule.',
      publishedAt: new Date().toISOString(),
      _status: 'published',
      content: doc(
        p('La LOA et le crédit auto permettent tous deux de rouler sans payer le véhicule comptant. Mais ils ne répondent pas aux mêmes besoins.'),
        h2('La LOA : une mensualité plus basse'),
        p('En LOA, vous payez l’usage du véhicule. Les loyers sont souvent plus bas, et vous décidez en fin de contrat de l’acheter ou de le rendre.'),
        h2('Le crédit : propriétaire tout de suite'),
        p('Avec un crédit affecté, le véhicule est à vous dès la livraison. Aucune limite de kilométrage, et vous le revendez quand vous voulez.'),
        h2('Notre conseil'),
        ul(['Vous changez souvent de voiture : la LOA.', 'Vous roulez beaucoup ou gardez longtemps vos véhicules : le crédit.', 'Vous êtes professionnel ou VTC : regardez aussi la LLD.']),
      ),
    },
  })
  await payload.create({
    collection: 'articles',
    draft: false,
    data: {
      title: 'Les pièces à fournir pour un financement auto',
      excerpt: 'La liste complète des justificatifs pour les salariés, les indépendants et les sociétés.',
      publishedAt: new Date().toISOString(),
      _status: 'published',
      content: doc(
        h2('Salariés'),
        ul(['Pièce d’identité recto/verso', 'Justificatif de domicile de moins de 3 mois', '3 derniers bulletins de salaire', 'Dernier avis d’imposition', 'RIB']),
        h2('Indépendants et VTC'),
        ul(['Pièce d’identité', 'Extrait INSEE ou avis SIREN', 'Attestation URSSAF de moins de 3 mois', '3 derniers relevés bancaires', 'Dernier avis d’imposition', 'RIB']),
        h2('Sociétés'),
        ul(['Pièce d’identité du gérant', 'Kbis de moins de 3 mois', 'Statuts à jour', 'Liasses fiscales des deux derniers exercices', 'RIB de la société']),
      ),
    },
  })
  done.push('2 guides')
}

// PUB-18 : FAQ (les 4 premières questions viennent de l'ancien site)
const faqCount = await payload.count({ collection: 'faqs' })
if (faqCount.totalDocs === 0) {
  const faqs: [string, string, 'general' | 'loa' | 'lld' | 'credit' | 'dossier' | 'livraison'][] = [
    ['Quel délai pour obtenir un accord ?', 'Une fois le dossier complet, l’accord de principe tombe en général sous 24 à 48 h ouvrées, selon l’organisme financier.', 'general'],
    ['Comment se passe la fin d’une LOA ?', 'Vous rachetez le véhicule à la valeur résiduelle fixée dans le contrat, ou vous le restituez simplement.', 'loa'],
    ['Le financement est-il adapté aux VTC et aux pros ?', 'Oui. La durée, le kilométrage et les garanties sont ajustés à un usage professionnel ou VTC.', 'general'],
    ['Quels documents dois-je fournir ?', 'Pièce d’identité, justificatif de domicile de moins de 3 mois, 3 derniers bulletins de salaire, dernier avis d’imposition et RIB. Pour les sociétés : Kbis et liasses fiscales.', 'dossier'],
    ['Les véhicules sont-ils garantis ?', 'Oui. Nos véhicules sont contrôlés avant la vente et garantis 12 mois. Le détail de la garantie vous est remis avec le véhicule.', 'livraison'],
    ['Livrez-vous en dehors de l’Île-de-France ?', 'Oui, nous livrons partout en France. Les conditions de livraison vous sont précisées avant la commande. Vous pouvez aussi venir chercher le véhicule à l’agence d’Épinay-sur-Seine.', 'livraison'],
    ['Puis-je essayer le véhicule avant de m’engager ?', 'Oui. Réservez un créneau en ligne : vous recevez une confirmation par e-mail et un rappel la veille. Pensez à votre permis de conduire.', 'general'],
    ['Puis-je faire reprendre mon véhicule actuel ?', 'Oui. Décrivez-le avec quelques photos sur la page Reprise : vous recevez une estimation sous 48 h, sans engagement. Le montant peut servir d’apport.', 'general'],
    ['Le financement est-il possible sans apport ?', 'Oui, le financement peut couvrir tout le prix du véhicule selon votre dossier. Un apport ou une reprise réduit simplement la mensualité.', 'credit'],
    ['Quelle est la différence entre LOA et LLD ?', 'En LOA, vous pouvez acheter le véhicule en fin de contrat en levant l’option d’achat. En LLD, il n’y a pas d’option d’achat : vous rendez simplement le véhicule.', 'lld'],
    ['Puis-je rembourser mon crédit auto par anticipation ?', 'Oui, en tout ou partie. Une indemnité peut s’appliquer ; elle est plafonnée par la loi et précisée dans votre offre de crédit.', 'credit'],
    ['Ai-je un délai de rétractation ?', 'Oui. Pour un crédit auto ou une LOA, vous disposez de 14 jours après la signature de l’offre pour vous rétracter, sans avoir à vous justifier.', 'credit'],
    ['Comment envoyer mes justificatifs ?', 'Directement en ligne, depuis votre demande de financement : une photo nette ou un PDF suffit pour chaque pièce. Vos documents sont stockés de façon sécurisée et ne servent qu’à l’étude de votre dossier.', 'dossier'],
    ['Mon dossier est incomplet : que se passe-t-il ?', 'Un conseiller vous prévient et vous indique précisément la pièce manquante. L’étude reprend dès qu’elle est reçue.', 'dossier'],
    ['Le kilométrage est-il limité en LLD ?', 'Oui. Vous choisissez un kilométrage annuel à la signature. Les kilomètres en trop sont facturés en fin de contrat, au tarif prévu.', 'lld'],
    ['Qui assure le véhicule en LOA ou en LLD ?', 'Vous. Pendant le contrat, vous assurez le véhicule, en général tous risques. L’attestation est demandée avant la livraison.', 'loa'],
  ]
  for (const [i, [question, answer, category]] of faqs.entries()) {
    await payload.create({ collection: 'faqs', data: { question, answer: doc(p(answer)), category, order: i } })
  }
  done.push(`${faqs.length} questions de FAQ`)
}

// PUB-18 : guides complémentaires (créés s'ils n'existent pas encore, d'après leur titre)
const guides: { title: string; excerpt: string; content: Node[] }[] = [
  {
    title: 'LOA ou LLD : quelles différences ?',
    excerpt: 'Option d’achat, kilométrage, fin de contrat, fiscalité : ce qui distingue vraiment les deux locations.',
    content: [
      p('La LOA et la LLD sont deux formes de location : dans les deux cas, vous payez un loyer pour utiliser un véhicule qui ne vous appartient pas pendant le contrat. La grande différence se joue à la fin.'),
      h2('La LOA : une porte ouverte vers l’achat'),
      p('La location avec option d’achat prévoit dès la signature un prix de rachat, l’option d’achat. En fin de contrat, vous choisissez : payer cette option et garder le véhicule, ou le rendre. C’est un contrat de crédit à la consommation, avec un TAEG et un délai de rétractation de 14 jours.'),
      h2('La LLD : l’usage, sans la propriété'),
      p('La location longue durée ne prévoit pas d’achat. Vous rendez le véhicule à la fin, après un état des lieux. Le loyer est en général plus bas qu’en LOA, et l’entretien peut être inclus selon l’offre.'),
      h2('Les points communs'),
      ul(['Un loyer fixe pendant toute la durée du contrat.', 'Un kilométrage annuel défini à la signature, facturé en cas de dépassement.', 'Une restitution en bon état d’usage, hors usure normale.', 'Un apport facultatif qui réduit les loyers.']),
      h2('Laquelle choisir ?'),
      ul(['Vous voulez pouvoir garder la voiture : la LOA.', 'Vous voulez un budget fixe sans jamais gérer de revente : la LLD.', 'Vous êtes professionnel ou VTC : la LLD est souvent la plus simple à gérer, à vérifier avec votre expert-comptable.']),
    ],
  },
  {
    title: 'Fin de LOA : acheter, rendre ou changer de véhicule',
    excerpt: 'Vos trois options en fin de location avec option d’achat, et comment bien préparer la restitution.',
    content: [
      p('Quelques mois avant la fin de votre LOA, l’organisme financier vous contacte pour connaître votre choix. Trois possibilités s’offrent à vous.'),
      h2('1. Lever l’option d’achat'),
      p('Vous payez le montant de l’option d’achat, fixé dès la signature. Le véhicule devient le vôtre et la carte grise passe à votre nom. Le dépassement kilométrique n’est alors pas facturé.'),
      h2('2. Restituer le véhicule'),
      p('Vous rendez le véhicule et vous n’avez plus rien à payer, sauf en cas de dépassement du kilométrage prévu ou de dégâts allant au-delà de l’usure normale.'),
      h2('3. Changer de véhicule'),
      p('Vous restituez votre véhicule et repartez avec un nouveau contrat. C’est la solution pour rouler toujours dans un véhicule récent.'),
      h2('Bien préparer la restitution'),
      ul(['Faites réparer les petits dégâts avant l’état des lieux : c’est souvent moins cher.', 'Rassemblez le carnet d’entretien, les factures et les doubles des clés.', 'Nettoyez le véhicule, intérieur compris.', 'Vérifiez votre kilométrage par rapport au forfait prévu.']),
    ],
  },
  {
    title: 'TAEG et coût total : bien comparer deux financements',
    excerpt: 'Mensualité, TAEG, coût total, option d’achat : les chiffres à regarder avant de signer.',
    content: [
      p('Deux offres de financement pour la même voiture peuvent afficher des mensualités proches et coûter des montants très différents. Voici les chiffres à comparer.'),
      h2('Le TAEG'),
      p('Le taux annuel effectif global regroupe les intérêts et les frais obligatoires du financement. Il doit figurer sur toute offre de crédit : c’est le meilleur indicateur pour comparer deux offres de même durée.'),
      h2('Le coût total'),
      p('C’est la somme de tout ce que vous payez : apport, mensualités et, en LOA, option d’achat si vous l’exercez. Comparez-le au prix du véhicule pour connaître le vrai coût du financement.'),
      h2('La durée'),
      p('Une durée plus longue baisse la mensualité mais augmente le coût total. Choisissez la durée la plus courte compatible avec votre budget.'),
      h2('Les options'),
      p('L’assurance emprunteur, l’extension de garantie ou l’entretien inclus augmentent la mensualité. Elles peuvent être utiles : vérifiez simplement ce qu’elles couvrent et leur coût.'),
      p('Un crédit vous engage et doit être remboursé. Vérifiez vos capacités de remboursement avant de vous engager.'),
    ],
  },
  {
    title: 'Faire reprendre sa voiture : obtenir la meilleure estimation',
    excerpt: 'Ce qui fait la valeur de votre véhicule et les bons réflexes avant de le faire estimer.',
    content: [
      p('La reprise de votre véhicule actuel peut servir d’apport pour le prochain et faire baisser vos mensualités. Quelques réflexes simples permettent d’en tirer le meilleur prix.'),
      h2('Ce qui compte dans l’estimation'),
      ul(['L’année et le kilométrage.', 'L’historique d’entretien, prouvé par le carnet et les factures.', 'L’état de la carrosserie, de l’intérieur et des pneus.', 'La motorisation, la boîte et les équipements.', 'La demande du marché pour votre modèle.']),
      h2('Avant la demande d’estimation'),
      ul(['Prenez des photos nettes, à la lumière du jour : avant, arrière, côtés, intérieur et compteur.', 'Signalez les défauts : l’estimation sera juste et confirmée sans surprise.', 'Rassemblez carte grise, contrôle technique, carnet et doubles des clés.']),
      h2('Et si le véhicule est encore en financement ?'),
      p('La reprise reste souvent possible : nous tenons compte du capital restant dû et nous nous occupons des démarches avec l’organisme financier.'),
    ],
  },
]
const created: string[] = []
for (const g of guides) {
  const exists = await payload.count({ collection: 'articles', where: { title: { equals: g.title } } })
  if (exists.totalDocs > 0) continue
  await payload.create({
    collection: 'articles',
    draft: false,
    data: { title: g.title, excerpt: g.excerpt, publishedAt: new Date().toISOString(), _status: 'published', content: doc(...g.content) },
  })
  created.push(g.title)
}
if (created.length) done.push(`${created.length} guides`)

console.log(done.length ? `Contenus ajoutés : ${done.join(', ')}.` : 'Rien à ajouter : tout est déjà rempli.')
process.exit(0)
