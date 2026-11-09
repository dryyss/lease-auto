// PUB-16 : importe les avis Google de l'agence dans Admin → Avis clients. Usage : pnpm sync:avis
//
// Variables (.env) :
//   GOOGLE_PLACES_API_KEY : clé Google Cloud avec « Places API (New) » activée.
//   GOOGLE_PLACE_ID       : identifiant de la fiche. Absent : le script cherche la fiche et affiche les identifiants trouvés.
//
// Limite de Google : l'API ne renvoie que les 5 avis les plus pertinents. Relancé régulièrement, le script accumule
// les nouveaux avis sans doublon (clé sourceId). Seul le prénom de l'auteur est conservé.
// Mis en avant d'office : les avis 4 et 5 étoiles. Les autres sont importés mais pas affichés, à trier dans l'admin.
import { getPayload } from 'payload'

import config from '@payload-config'

const key = process.env.GOOGLE_PLACES_API_KEY
if (!key) {
  console.error('GOOGLE_PLACES_API_KEY manquante dans .env (clé Google Cloud, API « Places API (New) » activée).')
  process.exit(1)
}

const api = async (url: string, fieldMask: string, body?: object) => {
  const res = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': fieldMask, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`Google Places ${res.status} : ${await res.text()}`)
  return res.json()
}

const placeId = process.env.GOOGLE_PLACE_ID
if (!placeId) {
  const found = await api('https://places.googleapis.com/v1/places:searchText', 'places.id,places.displayName,places.formattedAddress', {
    textQuery: 'Lease Auto 42 boulevard Foch Épinay-sur-Seine',
    languageCode: 'fr',
  })
  console.log('GOOGLE_PLACE_ID absent. Fiches trouvées, copiez le bon identifiant dans .env :')
  for (const p of found.places ?? []) console.log(`  ${p.id}  ${p.displayName?.text} · ${p.formattedAddress}`)
  process.exit(0)
}

type GoogleReview = {
  name: string
  rating: number
  publishTime: string
  text?: { text: string }
  originalText?: { text: string }
  authorAttribution?: { displayName?: string }
}
const place = await api(`https://places.googleapis.com/v1/places/${placeId}?languageCode=fr`, 'displayName,rating,userRatingCount,reviews')
const reviews: GoogleReview[] = place.reviews ?? []

const payload = await getPayload({ config })
let created = 0
for (const r of reviews) {
  const text = (r.originalText?.text ?? r.text?.text ?? '').trim()
  if (!text) continue // note sans commentaire : rien à afficher
  const exists = await payload.count({ collection: 'reviews', where: { sourceId: { equals: r.name } }, overrideAccess: true })
  if (exists.totalDocs) continue
  await payload.create({
    collection: 'reviews',
    overrideAccess: true,
    data: {
      firstName: (r.authorAttribution?.displayName ?? 'Client').split(/\s+/)[0],
      rating: r.rating,
      date: r.publishTime,
      text,
      source: 'google',
      sourceId: r.name,
      featured: r.rating >= 4,
    },
  })
  created++
}

console.log(`${place.displayName?.text} : note Google ${place.rating}/5 sur ${place.userRatingCount} avis.`)
console.log(`${reviews.length} avis renvoyés par Google, ${created} nouveau(x) importé(s).`)
process.exit(0)
