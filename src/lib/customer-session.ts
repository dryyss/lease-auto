import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'

import { cookies } from 'next/headers'

// Espace acheteur : pas de compte ni de mot de passe. Le client entre la référence de sa demande et son e-mail ;
// on pose alors un cookie signé qui porte son e-mail. Tout ce qu'il voit ensuite est filtré sur cet e-mail.

const COOKIE = 'lease-client'
const DAYS = 7

const sign = (value: string) => createHmac('sha256', `${process.env.PAYLOAD_SECRET ?? ''}:espace-client`).update(value).digest('base64url')

export async function openCustomerSession(email: string) {
  const body = `${Buffer.from(email).toString('base64url')}.${Date.now() + DAYS * 86_400_000}`
  const jar = await cookies()
  jar.set(COOKIE, `${body}.${sign(body)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: DAYS * 86_400,
  })
}

export async function closeCustomerSession() {
  const jar = await cookies()
  jar.set(COOKIE, '', { path: '/', maxAge: 0 })
}

/** E-mail du client connecté, ou null (cookie absent, expiré ou falsifié). */
export async function customerEmail(): Promise<string | null> {
  const raw = (await cookies()).get(COOKIE)?.value
  if (!raw) return null
  const [mail, expires, sig] = raw.split('.')
  if (!mail || !expires || !sig) return null
  const expected = Buffer.from(sign(`${mail}.${expires}`))
  const given = Buffer.from(sig)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
  if (Number(expires) < Date.now()) return null
  return Buffer.from(mail, 'base64url').toString()
}
