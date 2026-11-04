import { expect, test } from '@playwright/test'

test('la page d’accueil s’affiche', async ({ page }) => {
  await page.goto('http://localhost:3000')
  await expect(page).toHaveTitle(/Lease Auto/)
  await expect(page.locator('h1').first()).toBeVisible()
})

test('l’administration renvoie vers Auth0 quand on n’est pas connecté', async ({ page }) => {
  const response = await page.request.get('http://localhost:3000/admin/login', { maxRedirects: 0 })
  expect(response.status()).toBe(307)
  expect(response.headers().location).toContain('/auth/login')
})
