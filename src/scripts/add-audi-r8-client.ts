// Véhicule envoyé par le client le 18/11/2026 (fiche Word + 10 photos à la racine du projet).
// Usage : FILES_IN_DATABASE=1 pnpm payload run src/scripts/add-audi-r8-client.ts
// Ne recrée pas le véhicule s'il existe déjà (référence LA-R8-2019-BLEU).
import fs from 'node:fs'
import path from 'node:path'

import { getPayload } from 'payload'

import config from '@payload-config'

const payload = await getPayload({ config })
const REFERENCE = 'LA-R8-2019-BLEU'
const TITLE = 'Audi R8 II 5.2 V10 FSI 570 ch quattro S tronic'

const exists = await payload.count({ collection: 'vehicles', where: { reference: { equals: REFERENCE } }, overrideAccess: true })
if (exists.totalDocs) {
  console.log('Déjà présent : rien à faire.')
  process.exit(0)
}

const findOrCreate = async (collection: 'brands' | 'models', where: object, data: object) => {
  const { docs } = await payload.find({ collection, where: where as never, limit: 1, depth: 0, overrideAccess: true })
  return docs[0]?.id ?? (await payload.create({ collection, data: data as never, overrideAccess: true })).id
}
const brand = await findOrCreate('brands', { name: { equals: 'Audi' } }, { name: 'Audi' })
const model = await findOrCreate('models', { and: [{ name: { equals: 'R8' } }, { brand: { equals: brand } }] }, { name: 'R8', brand })

// Photos dans l'ordre du client : la n°1 (avant trois-quarts) devient la photo principale.
const ALTS = [
  'vue avant trois-quarts gauche',
  'vue avant trois-quarts droite',
  'vue arrière trois-quarts gauche',
  'vue arrière trois-quarts droite',
  'poste de conduite et volant',
  'sièges avant cuir',
  'siège conducteur matelassé',
  'combiné d’instruments et caméra de recul',
  'console centrale et clés',
  'jante noire et étrier de frein',
]
const gallery: number[] = []
for (let i = 1; i <= 10; i++) {
  const filePath = path.resolve(`Photo N°${i}.PNG`)
  if (!fs.existsSync(filePath)) throw new Error(`Photo manquante : ${filePath}`)
  const media = await payload.create({
    collection: 'media',
    data: { alt: `${TITLE}, ${ALTS[i - 1]}` },
    file: { data: fs.readFileSync(filePath), mimetype: 'image/png', name: `audi-r8-v10-2019-bleu-${i}.png`, size: fs.statSync(filePath).size },
    overrideAccess: true,
  })
  gallery.push(media.id)
  console.log(`Photo ${i}/10 en ligne`)
}

const paragraph = (text: string) => ({
  type: 'paragraph',
  format: '' as const,
  indent: 0,
  version: 1,
  direction: 'ltr' as const,
  textFormat: 0,
  children: [{ type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
})

const equipment = [
  'Peinture intégrale',
  'Caméra de recul',
  'Régulateur et limiteur de vitesse',
  'Sièges chauffants',
  'Système audio Bang & Olufsen',
  'Traceur GPS',
  'Audi Drive Select',
  'Audi Magnetic Ride',
  'Boîte S tronic 7 rapports à double embrayage',
  'Climatisation automatique confort spéciale R8',
  'Blocage électronique de différentiel (EDS)',
  'Feux et essuie-glaces automatiques',
  'Fixation ISOFIX sur siège passager',
  'Freins avant 8 pistons et arrière 4 pistons, disques « wave »',
  'Navigation MMI plus avec MMI touch',
  'Side blades argent glacier métal',
  'Phares LED avec éclairage laser Audi',
  'Réservoir de 83 litres',
  'Rétroviseurs électriques rabattables et dégivrants',
  'Sièges Sport R8 réglables électriquement en hauteur',
  'Accès et démarrage sans clé (Keyless Access)',
  'Éclairage d’accueil LED dans les portières',
  'Seuils de portes aluminium avec inscription R8',
  'Vitres athermiques teintées et pare-brise acoustique',
  'Carnet d’entretien',
]

const vehicle = await payload.create({
  collection: 'vehicles',
  draft: false,
  overrideAccess: true,
  context: { skipAlerts: true },
  data: {
    brand,
    model,
    title: TITLE,
    reference: REFERENCE,
    status: 'available',
    _status: 'published',
    gallery,
    year: 2019,
    firstRegistration: '2019-06-02T12:00:00.000Z',
    mileage: 49_990,
    fuel: 'essence',
    gearbox: 'automatique',
    bodyType: 'coupe',
    powerHp: 570,
    fiscalHp: 49,
    co2: 291,
    doors: 2,
    seats: 2,
    color: 'Bleu',
    critAir: '1',
    price: 139_990,
    warrantyMonths: 12,
    equipment: equipment.map((label) => ({ label })),
    description: {
      root: {
        type: 'root',
        format: '' as const,
        indent: 0,
        version: 1,
        direction: 'ltr' as const,
        children: [
          paragraph('Audi R8 de deuxième génération, V10 5.2 FSI de 570 ch, transmission intégrale quattro et boîte S tronic à 7 rapports. Mise en circulation le 2 juin 2019, 49 990 km, carnet d’entretien.'),
          paragraph('Finition quattro avec Audi Magnetic Ride, Audi Drive Select, phares LED à éclairage laser, navigation MMI plus, système audio Bang & Olufsen, sièges Sport R8 chauffants et caméra de recul. Peinture intégrale.'),
          paragraph('Reprise possible de votre véhicule actuel. Financement en LOA, LLD ou crédit, avec ou sans apport : demandez votre simulation personnalisée. Véhicule visible dans notre showroom du 42 boulevard Foch à Épinay-sur-Seine.'),
        ],
      },
    },
  } as never,
})
console.log(`Véhicule créé : ${vehicle.id} · /vehicule/${(vehicle as { slug?: string }).slug}`)
process.exit(0)
