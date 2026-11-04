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

console.log(done.length ? `Contenus ajoutés : ${done.join(', ')}.` : 'Rien à ajouter : tout est déjà rempli.')
process.exit(0)
