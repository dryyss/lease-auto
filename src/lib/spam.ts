import 'server-only'

import { headers } from 'next/headers'

// CONF-03 : protection anti-spam des formulaires, sans captcha visible.
// 1. Champ piège invisible (« website ») que seuls les robots remplissent.
// 2. Délai minimal entre l'affichage et l'envoi (un humain met plus de 3 s).
// 3. Limite d'envois par adresse IP. En mémoire : suffisant pour freiner un robot,
//    à remplacer par un stockage partagé (Upstash, Vercel KV) si le spam devient sérieux.

const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 8
const hits = new Map<string, number[]>()

export async function checkSpam(form: FormData): Promise<string | null> {
  if (String(form.get('website') ?? '').trim()) return 'Envoi refusé.'

  const startedAt = Number(form.get('startedAt'))
  if (!startedAt || Date.now() - startedAt < 3000) return 'Merci de vérifier le formulaire avant de l’envoyer.'

  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'inconnu'
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) return 'Trop d’envois en peu de temps. Réessayez dans quelques minutes ou appelez-nous.'
  recent.push(now)
  hits.set(ip, recent)
  return null
}
