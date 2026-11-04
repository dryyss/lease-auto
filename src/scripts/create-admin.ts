// Crée (ou réactive) un administrateur. Usage : pnpm create-admin prenom.nom@exemple.fr "Prénom Nom"
import { getPayload } from 'payload'

import config from '@payload-config'

const [email, name = 'Administrateur'] = process.argv.slice(2)
if (!email) {
  console.error('Usage : pnpm create-admin <email> "<nom>"')
  process.exit(1)
}

const payload = await getPayload({ config })
const { docs } = await payload.find({ collection: 'users', where: { email: { equals: email.toLowerCase() } }, limit: 1 })

if (docs[0]) {
  await payload.update({ collection: 'users', id: docs[0].id, data: { role: 'admin', disabled: false } })
  console.log(`${email} est maintenant administrateur.`)
} else {
  await payload.create({ collection: 'users', data: { email, name, role: 'admin' } })
  console.log(`Administrateur ${email} créé. Il se connecte sur /admin avec son compte Auth0.`)
}
process.exit(0)
