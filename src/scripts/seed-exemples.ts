// Données d'EXEMPLE côté clients, pour présenter l'administration au client Lease Auto.
// Usage : pnpm seed:exemples            → crée les exemples (ne fait rien s'ils existent déjà)
//         pnpm seed:exemples supprimer → supprime tous les exemples (à faire avant la mise en ligne)
//         (sans tirets : `payload run` ne transmet pas les options en « -- » au script)
//
// Tout est reconnaissable : demandes d'origine « exemple », e-mails en @example.com (domaine réservé, rien n'est délivré),
// newsletter préfixée « [Exemple] ». Aucun e-mail n'est envoyé : les crochets d'envoi sont coupés (skipEmails),
// et la newsletter reste en brouillon. Avis clients d'exemple : étiquetés « Exemple » sur le site (sourceId « exemple-… »),
// jamais présentés comme de vrais avis, et supprimés avec le reste.
import { getPayload } from 'payload'

import config from '@payload-config'
import { DEMO_CUSTOMER } from '@/lib/demo-customer'
import type { Request } from '@/payload-types'

const payload = await getPayload({ config })
const ctx = { skipEmails: true, skipAlerts: true, skipSend: true }
const SOURCE = 'exemple'
const DOMAIN = '@example.com'

if (process.argv.some((a) => a.replace(/^--/, '') === 'supprimer')) {
  const del = async (collection: 'requests' | 'appointments' | 'subscribers' | 'campaigns', where: object) => {
    const { docs } = await payload.delete({ collection, where: where as never, overrideAccess: true, context: ctx })
    console.log(`${collection} : ${docs.length} supprimé(s)`)
  }
  await del('appointments', { email: { like: DOMAIN } })
  await del('requests', { source: { equals: SOURCE } })
  await del('subscribers', { email: { like: DOMAIN } })
  await del('campaigns', { subject: { like: '[Exemple]' } })
  const { docs: reviews } = await payload.delete({ collection: 'reviews', where: { sourceId: { like: 'exemple-' } }, overrideAccess: true })
  console.log(`reviews : ${reviews.length} supprimé(s)`)
  process.exit(0)
}

// Avis d'exemple (un bandeau par réseau) : créés à part, sans doublon, même si les demandes d'exemple existent déjà.
const REVIEWS: { source: 'google' | 'instagram' | 'tiktok'; name: string; rating?: number; days: number; text: string }[] = [
  { source: 'google', name: 'Sarah', rating: 5, days: 6, text: 'Dossier LOA monté en quelques jours, conseiller très clair sur la mensualité et l’option d’achat. Voiture livrée propre et révisée.' },
  { source: 'google', name: 'Karim', rating: 5, days: 14, text: 'Indépendant VTC, on m’avait refusé ailleurs. Ici, dossier étudié sérieusement et voiture obtenue.' },
  { source: 'google', name: 'Julie', rating: 4, days: 23, text: 'Bon accueil à l’agence d’Épinay, essai sur rendez-vous, explications honnêtes. Un peu d’attente pour les papiers.' },
  { source: 'google', name: 'Mehdi', rating: 5, days: 37, text: 'Reprise de mon ancienne voiture et LLD sans surprise. Je recommande.' },
  { source: 'instagram', name: '@nadia.drive', days: 4, text: 'Merci Lease Auto pour la Clio, livraison nickel !' },
  { source: 'instagram', name: '@yanis_93', days: 11, text: 'Équipe au top, ils m’ont tout expliqué pour la LOA.' },
  { source: 'instagram', name: '@lea.mtn', days: 19, text: 'Deuxième voiture prise chez eux, toujours aussi pro.' },
  { source: 'tiktok', name: '@fatou.auto', days: 3, text: 'La remise des clés, trop contente de ma Peugeot 208 !' },
  { source: 'tiktok', name: '@samir.vtc', days: 9, text: 'VTC et financé, ils l’ont fait. Merci la team Lease Auto.' },
  { source: 'tiktok', name: '@ines_rd', days: 16, text: 'Ambiance au top à l’agence, et la voiture est parfaite.' },
]
let reviewsCreated = 0
for (const [i, r] of REVIEWS.entries()) {
  const sourceId = `exemple-${i + 1}`
  const exists = await payload.count({ collection: 'reviews', where: { sourceId: { equals: sourceId } }, overrideAccess: true })
  if (exists.totalDocs) continue
  await payload.create({
    collection: 'reviews',
    overrideAccess: true,
    data: { sourceId, source: r.source, firstName: r.name, rating: r.rating, text: r.text, date: new Date(Date.now() - r.days * 86_400_000).toISOString(), featured: true },
  })
  reviewsCreated++
}
console.log(`Avis d'exemple : ${reviewsCreated} créé(s)`)

// Acheteur de démonstration pour l'espace client (/mon-espace) : un financement à l'étude avec pièces manquantes,
// une reprise déjà traitée et un essai à venir. Créé à part, sans doublon.
const demoExists = await payload.count({ collection: 'requests', where: { reference: { equals: DEMO_CUSTOMER.reference } }, overrideAccess: true })
if (!demoExists.totalDocs) {
  const [car, advisor] = await Promise.all([
    payload.find({ collection: 'vehicles', where: { _status: { equals: 'published' } }, sort: 'price', limit: 1, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'users', where: { role: { equals: 'commercial' } }, limit: 1, depth: 0, overrideAccess: true }),
  ])
  const who = { firstName: DEMO_CUSTOMER.firstName, lastName: DEMO_CUSTOMER.lastName, email: DEMO_CUSTOMER.email, phone: DEMO_CUSTOMER.phone, postalCode: '93800', source: SOURCE }
  const day = 86_400_000
  await payload.create({
    collection: 'requests',
    overrideAccess: true,
    context: ctx,
    data: {
      ...who,
      reference: DEMO_CUSTOMER.reference,
      type: 'financing',
      status: 'review',
      vehicle: car.docs[0]?.id,
      formula: 'loa',
      months: 48,
      deposit: 2000,
      profile: 'cdi',
      monthlyIncome: 2400,
      missingDocuments: true,
      assignedTo: advisor.docs[0]?.id,
      createdAt: new Date(Date.now() - 2 * day).toISOString(),
    } as never,
  })
  await payload.create({
    collection: 'requests',
    overrideAccess: true,
    context: ctx,
    data: {
      ...who,
      reference: 'LA-DEMO-REPRISE',
      type: 'tradein',
      status: 'delivered',
      tradeIn: { brand: 'Renault', model: 'Clio IV 0.9 TCe', year: 2017, mileage: 86000 },
      assignedTo: advisor.docs[0]?.id,
      createdAt: new Date(Date.now() - 9 * day).toISOString(),
    } as never,
  })
  // Essai dans 3 jours à 14 h, heure de Paris (13 h UTC en hiver).
  const slot = new Date(Date.now() + 3 * day)
  slot.setUTCHours(13, 0, 0, 0)
  await payload.create({
    collection: 'appointments',
    overrideAccess: true,
    context: ctx,
    data: { name: `${DEMO_CUSTOMER.firstName} ${DEMO_CUSTOMER.lastName}`, email: DEMO_CUSTOMER.email, phone: DEMO_CUSTOMER.phone, startsAt: slot.toISOString(), kind: 'test-drive', status: 'confirmed', vehicle: car.docs[0]?.id } as never,
  })
  console.log(`Acheteur de démonstration créé : ${DEMO_CUSTOMER.reference} / ${DEMO_CUSTOMER.email}`)
}

// Les deux demandes de l'acheteur de démonstration (créées juste au-dessus) ne comptent pas : sinon, sur une base neuve,
// elles feraient croire que les exemples existent déjà et rien d'autre ne serait créé.
const already = await payload.count({
  collection: 'requests',
  where: { and: [{ source: { equals: SOURCE } }, { reference: { not_in: [DEMO_CUSTOMER.reference, 'LA-DEMO-REPRISE'] } }] },
  overrideAccess: true,
})
if (already.totalDocs > 0) {
  console.log(`Exemples déjà présents (${already.totalDocs} demandes). Rien n'est créé. Pour repartir de zéro : pnpm seed:exemples supprimer.`)
  process.exit(0)
}

const H = 3_600_000
const D = 24 * H
const now = Date.now()
const ago = (ms: number) => new Date(now - ms).toISOString()
/** Jour J + n à hh:mm, heure de Paris (le serveur peut tourner en UTC). */
const at = (dayOffset: number, hh: number, mm = 0) => {
  const d = new Date(now + dayOffset * D)
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(d)
  const probe = new Date(`${ymd}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00Z`)
  const parisHour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', hourCycle: 'h23' }).format(probe))
  return new Date(probe.getTime() - (parisHour - hh) * H).toISOString()
}

// Équipe : on répartit les dossiers entre les comptes existants (commerciaux d'abord).
const { docs: users } = await payload.find({ collection: 'users', limit: 20, depth: 0, overrideAccess: true })
const sellers = users.filter((u) => u.role === 'commercial')
const owner = (i: number) => (sellers.length ? sellers[i % sellers.length].id : users[0]?.id)

type Ex = Partial<Request> & { firstName: string; lastName: string; ageH: number; replyH?: number }
const people: Ex[] = [
  // À prendre
  { type: 'financing', status: 'new', firstName: 'Nadia', lastName: 'Haddad', formula: 'loa', months: 48, deposit: 3000, profile: 'cdi', monthlyIncome: 2800, monthlyBudget: 380, missingDocuments: true, postalCode: '93800', message: 'Je cherche un SUV familial, type Peugeot 3008 ou Renault Austral.', ageH: 30 },
  { type: 'callback', status: 'new', firstName: 'Julien', lastName: 'Moreau', postalCode: '95100', message: 'Merci de me rappeler après 18 h.', ageH: 5 },
  { type: 'tradein', status: 'new', firstName: 'Fatou', lastName: 'Diallo', postalCode: '93200', tradeIn: { brand: 'Citroën', model: 'C4', year: 2017, mileage: 98000 }, message: 'Reprise en vue d’une LOA.', ageH: 2 },
  { type: 'financing', status: 'new', firstName: 'Thomas', lastName: 'Petit', formula: 'credit', months: 60, deposit: 5000, profile: 'independant', monthlyIncome: 3500, monthlyBudget: 450, postalCode: '75018', message: 'Clio E-Tech ou Yaris hybride.', ageH: 1 },
  // En étude
  { type: 'financing', status: 'review', firstName: 'Mehdi', lastName: 'Kaci', formula: 'lld', months: 48, deposit: 2000, profile: 'societe', monthlyIncome: 6000, monthlyBudget: 550, missingDocuments: true, message: 'Activité VTC, besoin d’une berline hybride.', ageH: 3 * 24, replyH: 2 },
  { type: 'financing', status: 'review', firstName: 'Ibrahim', lastName: 'Touré', formula: 'credit', months: 72, deposit: 0, profile: 'cdi', monthlyIncome: 2400, monthlyBudget: 300, ageH: 8 * 24, replyH: 1 },
  { type: 'tradein', status: 'review', firstName: 'Laura', lastName: 'Fontaine', tradeIn: { brand: 'Renault', model: 'Mégane', year: 2016, mileage: 124000, estimate: 6500 }, ageH: 4 * 24, replyH: 6 },
  // Accordés
  { type: 'financing', status: 'approved', firstName: 'Claire', lastName: 'Martin', formula: 'loa', months: 49, deposit: 4000, profile: 'cdi', monthlyIncome: 3100, monthlyBudget: 420, ageH: 6 * 24, replyH: 4 },
  { type: 'financing', status: 'approved', firstName: 'Youssef', lastName: 'Amrani', formula: 'lld', months: 36, deposit: 1500, profile: 'independant', monthlyIncome: 4200, monthlyBudget: 500, ageH: 10 * 24, replyH: 3 },
  // Livrés et refusés (historique pour les statistiques)
  { type: 'financing', status: 'delivered', firstName: 'Sarah', lastName: 'Cohen', formula: 'loa', months: 48, deposit: 3500, profile: 'cdi', ageH: 18 * 24, replyH: 2 },
  { type: 'financing', status: 'delivered', firstName: 'Paul', lastName: 'Girard', formula: 'credit', months: 60, deposit: 6000, profile: 'retraite', ageH: 25 * 24, replyH: 5 },
  { type: 'financing', status: 'delivered', firstName: 'Aïcha', lastName: 'Benali', formula: 'loa', months: 37, deposit: 2500, profile: 'cdd', ageH: 12 * 24, replyH: 1 },
  { type: 'contact', status: 'delivered', firstName: 'Marc', lastName: 'Lefèvre', message: 'Question sur la garantie.', ageH: 9 * 24, replyH: 3 },
  { type: 'financing', status: 'refused', firstName: 'Kevin', lastName: 'Roux', formula: 'credit', months: 72, deposit: 0, profile: 'cdd', monthlyIncome: 1400, monthlyBudget: 350, refusalReason: 'income', ageH: 14 * 24, replyH: 8 },
  { type: 'callback', status: 'refused', firstName: 'Inès', lastName: 'Bernard', refusalReason: 'unreachable', ageH: 20 * 24, replyH: 2 },
]

const phone = (i: number) => `06 ${String(10 + i).padStart(2, '0')} ${String(20 + i * 3).padStart(2, '0')} ${String(30 + i * 2).padStart(2, '0')} ${String(40 + i).padStart(2, '0')}`
const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '')

const created: Request[] = []
for (const [i, p] of people.entries()) {
  const { ageH, replyH, ...data } = p
  const createdAt = ago(ageH * H)
  const working = data.status !== 'new'
  const history: Request['history'] = [{ status: 'new', at: createdAt }]
  if (working && replyH) history.push({ status: data.status === 'refused' ? 'refused' : 'review', at: ago((ageH - replyH) * H) })
  if (data.status === 'approved' || data.status === 'delivered') history.push({ status: 'approved', at: ago((ageH / 2) * H) })
  if (data.status === 'delivered') history.push({ status: 'delivered', at: ago((ageH / 4) * H) })

  const doc = await payload.create({
    collection: 'requests',
    overrideAccess: true,
    context: ctx,
    data: {
      ...data,
      email: `${slug(p.firstName)}.${slug(p.lastName)}${DOMAIN}`,
      phone: phone(i),
      source: SOURCE,
      marketingConsent: i % 3 === 0,
      assignedTo: working ? owner(i) : undefined,
      lastActionAt: working ? ago((ageH - (replyH ?? 1)) * H) : undefined,
      deliveredAt: data.status === 'delivered' ? ago((ageH / 4) * H) : undefined,
      history,
      notes: working ? [{ text: 'Client rappelé, dossier expliqué. (exemple)', at: ago((ageH - (replyH ?? 1)) * H) }] : undefined,
      createdAt,
    } as never,
  })
  created.push(doc)
}
console.log(`Demandes : ${created.length}`)

// Rendez-vous : un passé à clôturer, deux aujourd'hui, et la semaine à venir.
const byName = (first: string) => created.find((r) => r.firstName === first)
const appts = [
  { who: 'Paul', kind: 'visit', when: at(-1, 16) },
  { who: 'Claire', kind: 'delivery', when: at(0, 10, 30) },
  { who: 'Julien', kind: 'test-drive', when: at(0, 15) },
  { who: 'Mehdi', kind: 'visit', when: at(1, 11) },
  { who: 'Youssef', kind: 'delivery', when: at(2, 14, 30) },
  { who: 'Nadia', kind: 'test-drive', when: at(3, 17, 30) },
] as const
for (const a of appts) {
  const r = byName(a.who)!
  await payload.create({
    collection: 'appointments',
    overrideAccess: true,
    context: ctx,
    data: { startsAt: a.when, kind: a.kind, status: 'confirmed', name: `${r.firstName} ${r.lastName}`, email: r.email, phone: r.phone, request: r.id } as never,
  })
}
console.log(`Rendez-vous : ${appts.length}`)

// Abonnés : newsletter et alertes véhicule.
const subs = [
  { firstName: 'Camille', newsletter: true, alertEnabled: false },
  { firstName: 'Hugo', newsletter: true, alertEnabled: true, criteria: { maxPrice: 20000, maxMonthly: 300, fuels: ['hybride'] } },
  { firstName: 'Léa', newsletter: false, alertEnabled: true, criteria: { maxMonthly: 400, maxMileage: 80000 } },
  { firstName: 'Nicolas', newsletter: true, alertEnabled: false },
  { firstName: 'Sofia', newsletter: true, alertEnabled: true, criteria: { maxPrice: 30000, fuels: ['electrique', 'hybride'] } },
]
for (const [i, s] of subs.entries()) {
  await payload.create({
    collection: 'subscribers',
    overrideAccess: true,
    context: ctx,
    data: { ...s, email: `${slug(s.firstName)}.abonne${DOMAIN}`, consentAt: ago((i + 2) * 5 * D) } as never,
  })
}
console.log(`Abonnés : ${subs.length}`)

// Newsletter en brouillon (jamais envoyée).
await payload.create({
  collection: 'campaigns',
  overrideAccess: true,
  context: ctx,
  data: {
    subject: '[Exemple] Nos arrivages de la semaine',
    intro: 'Bonjour, voici les véhicules arrivés cette semaine à l’agence d’Épinay-sur-Seine, tous contrôlés et garantis 12 mois.',
    sendNow: false,
  } as never,
})
console.log('Newsletter : 1 brouillon')

// Créneaux de rendez-vous : horaires de l'agence, seulement si rien n'est encore saisi.
const agenda = await payload.findGlobal({ slug: 'agenda', depth: 0 })
if (!agenda.weekly?.length) {
  const weekday = (day: string) => ({ day, from: '09:30', to: '19:00' })
  await payload.updateGlobal({
    slug: 'agenda',
    overrideAccess: true,
    data: { weekly: [...['1', '2', '3', '4', '5'].map(weekday), { day: '6', from: '10:00', to: '18:00' }] } as never,
  })
  console.log('Créneaux : horaires de l’agence renseignés (lun.–ven. 9 h 30–19 h, sam. 10 h–18 h)')
}

process.exit(0)
