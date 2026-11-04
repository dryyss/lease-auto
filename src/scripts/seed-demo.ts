// Données de démonstration pour présenter les maquettes au client. Usage : pnpm seed:demo
// Ne tourne que sur une base sans véhicule. Taux et annonces FICTIFS : à remplacer avant la mise en ligne.
import path from 'path'
import { getPayload } from 'payload'

import config from '@payload-config'

const payload = await getPayload({ config })

const existing = await payload.count({ collection: 'vehicles' })
if (existing.totalDocs > 0) {
  console.log('La base contient déjà des véhicules : démo non importée.')
  process.exit(0)
}

const paragraph = (text: string) => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: [
      {
        type: 'paragraph',
        format: '' as const,
        indent: 0,
        version: 1,
        direction: 'ltr' as const,
        textFormat: 0,
        children: [{ type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
      },
    ],
  },
})

// Taux de démonstration, à remplacer par ceux des partenaires financiers.
await payload.updateGlobal({
  slug: 'settings',
  data: {
    financing: {
      loa: { enabled: true, annualRate: 5.9, taeg: 6.07, minMonths: 12, maxMonths: 84, defaultMonths: 49, defaultDepositPercent: 10, residualPercent: 35 },
      lld: { enabled: true, annualRate: 5.5, minMonths: 24, maxMonths: 60, defaultMonths: 48, defaultDepositPercent: 10, residualPercent: 40 },
      credit: { enabled: true, annualRate: 5.9, taeg: 6.07, minMonths: 12, maxMonths: 72, defaultMonths: 60, defaultDepositPercent: 10 },
    },
  },
})

// Questions reprises de l'ancien site.
const faqs = [
  ['Quel délai pour obtenir un accord ?', 'Une fois le dossier complet, l’accord de principe tombe en général sous 24 à 48 h ouvrées, selon l’organisme financier.', 'general'],
  ['Comment se passe la fin d’une LOA ?', 'Vous rachetez le véhicule à la valeur résiduelle fixée dans le contrat, ou vous le restituez simplement.', 'loa'],
  ['Le financement est-il adapté aux VTC et aux pros ?', 'Oui. La durée, le kilométrage et les garanties sont ajustés à un usage professionnel ou VTC.', 'general'],
  ['Quels documents dois-je fournir ?', 'Pièce d’identité, justificatif de domicile de moins de 3 mois, 3 derniers bulletins de salaire, dernier avis d’imposition et RIB. Pour les sociétés : Kbis et liasses fiscales.', 'dossier'],
] as const
for (const [i, [question, answer, category]] of faqs.entries()) {
  await payload.create({ collection: 'faqs', data: { question, answer: paragraph(answer), category, order: i } })
}

const photosDir = path.resolve(process.cwd(), 'ressources/ancien-site/images/pexels')
const upload = (file: string, alt: string) => payload.create({ collection: 'media', data: { alt }, filePath: path.join(photosDir, file) })

const brandIds: Record<string, number> = {}
const modelIds: Record<string, number> = {}
const ensureModel = async (brand: string, model: string) => {
  brandIds[brand] ??= (await payload.create({ collection: 'brands', data: { name: brand } })).id
  const key = `${brand}/${model}`
  modelIds[key] ??= (await payload.create({ collection: 'models', data: { brand: brandIds[brand], name: model } })).id
  return { brand: brandIds[brand], model: modelIds[key] }
}

const demo = [
  { brand: 'Audi', model: 'A3', title: 'Audi A3 Berline 35 TFSI S line', year: 2021, mileage: 38_500, fuel: 'essence', gearbox: 'automatique', bodyType: 'berline', price: 26_900, photos: ['pexels-1719648.jpg'] },
  { brand: 'Audi', model: 'TT', title: 'Audi TT Coupé 45 TFSI quattro', year: 2019, mileage: 52_000, fuel: 'essence', gearbox: 'automatique', bodyType: 'coupe', price: 33_490, photos: ['pexels-1149831.jpg'] },
  { brand: 'Alfa Romeo', model: '4C', title: 'Alfa Romeo 4C 1750 TBi', year: 2018, mileage: 24_800, fuel: 'essence', gearbox: 'automatique', bodyType: 'coupe', price: 54_900, photos: ['pexels-210019.jpg'] },
  { brand: 'Audi', model: 'R8', title: 'Audi R8 Coupé V10 performance', year: 2017, mileage: 41_200, fuel: 'essence', gearbox: 'automatique', bodyType: 'coupe', price: 109_900, photos: ['pexels-1402787.jpg', 'pexels-1545743.jpg'], status: 'reserved' },
] as const

for (const [i, v] of demo.entries()) {
  const ids = await ensureModel(v.brand, v.model)
  const gallery = []
  for (const file of v.photos) gallery.push((await upload(file, v.title)).id)
  await payload.create({
    collection: 'vehicles',
    draft: false,
    data: {
      ...ids,
      title: v.title,
      reference: `DEMO-${i + 1}`,
      year: v.year,
      mileage: v.mileage,
      fuel: v.fuel,
      gearbox: v.gearbox,
      bodyType: v.bodyType,
      price: v.price,
      status: 'status' in v ? v.status : 'available',
      featured: true,
      gallery,
      warrantyMonths: 12,
      equipment: [{ label: 'GPS' }, { label: 'Radar de recul' }, { label: 'Régulateur de vitesse' }],
      _status: 'published',
    },
  })
}

console.log(`Démo importée : ${demo.length} véhicules, ${faqs.length} questions, taux fictifs dans les Réglages.`)
process.exit(0)
