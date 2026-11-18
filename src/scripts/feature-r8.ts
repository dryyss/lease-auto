// Met l'Audi R8 du client « À la une » (page d'accueil). Usage : pnpm payload run src/scripts/feature-r8.ts
import { getPayload } from 'payload'

import config from '@payload-config'

const payload = await getPayload({ config })
const { docs } = await payload.find({ collection: 'vehicles', where: { reference: { equals: 'LA-R8-2019-BLEU' } }, limit: 1, depth: 0, overrideAccess: true })
if (!docs[0]) {
  console.log('Audi R8 introuvable.')
  process.exit(1)
}
await payload.update({ collection: 'vehicles', id: docs[0].id, data: { featured: true }, draft: false, overrideAccess: true, context: { skipAlerts: true } })
console.log(`Audi R8 (${docs[0].id}) mise à la une.`)
process.exit(0)
