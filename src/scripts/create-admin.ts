// Crée (ou réactive) un compte de l'équipe. Usage : pnpm create-admin prenom.nom@exemple.fr "Prénom Nom" [admin|commercial]
// Rôle par défaut : administrateur. La personne se connecte ensuite sur /admin avec son compte Auth0 (même e-mail).
import { getPayload } from 'payload'

import config from '@payload-config'

const [email, name = 'Administrateur', role = 'admin'] = process.argv.slice(2)
if (!email || (role !== 'admin' && role !== 'commercial')) {
  console.error('Usage : pnpm create-admin <email> "<nom>" [admin|commercial]')
  process.exit(1)
}
const label = role === 'admin' ? 'administrateur' : 'commercial'

const payload = await getPayload({ config })
const { docs } = await payload.find({ collection: 'users', where: { email: { equals: email.toLowerCase() } }, limit: 1 })

if (docs[0]) {
  await payload.update({ collection: 'users', id: docs[0].id, data: { role, disabled: false } })
  console.log(`${email} est maintenant ${label}.`)
} else {
  await payload.create({ collection: 'users', data: { email, name, role } })
  console.log(`Compte ${label} ${email} créé. Connexion sur /admin avec le compte Auth0 de cette adresse.`)
}
process.exit(0)
