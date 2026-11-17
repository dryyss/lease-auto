// Lancé au build Vercel juste avant « payload migrate ».
// Payload refuse de migrer (en silence, faute de terminal pour confirmer) si la table des migrations contient
// le marqueur « dev » (batch -1). Ici le schéma est géré uniquement par les migrations (push désactivé pour la
// base distante) : le marqueur, laissé par un script lancé depuis un poste, est retiré pour que la migration passe.
import { getPayload } from 'payload'

import config from '@payload-config'

const payload = await getPayload({ config })
const { docs } = await payload.delete({ collection: 'payload-migrations', where: { batch: { equals: -1 } }, overrideAccess: true })
console.log(docs.length ? `Marqueur « dev » retiré (${docs.length}) : la migration peut passer.` : 'Aucun marqueur « dev » : rien à faire.')
process.exit(0)
