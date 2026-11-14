'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { DEV_ACCOUNTS, DEV_COOKIE, devAuthAllowed, devCookieValue, demoCodeValid, type DevEmail } from '@/auth/devStrategy'
import { payloadClient } from '@/lib/payload'

export async function enterAs(email: DevEmail, code?: string) {
  if (!devAuthAllowed() && !demoCodeValid(code)) redirect('/')
  if (!(email in DEV_ACCOUNTS)) redirect('/')
  const account = DEV_ACCOUNTS[email]
  const payload = await payloadClient()
  const { docs } = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (docs[0]) {
    await payload.update({
      collection: 'users',
      id: docs[0].id,
      data: { role: account.role, name: account.name, disabled: false },
      overrideAccess: true,
    })
  } else {
    await payload.create({
      collection: 'users',
      data: { email, name: account.name, role: account.role },
      overrideAccess: true,
    })
  }
  const jar = await cookies()
  jar.set(DEV_COOKIE, await devCookieValue(email), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 12 })
  redirect('/admin')
}
