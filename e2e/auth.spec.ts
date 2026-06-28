import { test, expect } from './fixtures'

test.describe('Authentication', () => {
  test('shows the login form on /login', async ({ page }) => {
    await page.goto('/login')

    await expect(page.locator('h1')).toContainText('FutureKawa')
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('redirects unauthenticated users to /login', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page).toHaveURL('/login')
  })

  test('shows an error message for wrong credentials', async ({ loginPage }) => {
    await loginPage.goto()
    await loginPage.fillEmail('wrong@futurekawa.com')
    await loginPage.fillPassword('wrongpassword')
    await loginPage.submit()

    await expect(loginPage.errorMessage).toBeVisible()
  })

  test('logs in as HQ user and lands on the HQ page', async ({ page, loginAs }) => {
    await loginAs('hq')

    await expect(page).toHaveURL('/hq')
    await expect(page.locator('h2')).toContainText('Global Reporting')
  })

  test('logs in as farm_manager and lands on the farm page', async ({ page, loginAs }) => {
    await loginAs('farm_manager')

    await expect(page).toHaveURL('/farm')
    await expect(page.locator('h2')).toContainText('My Farm')
  })

  test('logs in as quality user and lands on the quality page', async ({ page, loginAs }) => {
    await loginAs('quality')

    await expect(page).toHaveURL('/quality')
    await expect(page.locator('h2')).toContainText('Quality')
  })

  test('logs out and redirects to /login', async ({ page, loginAs }) => {
    await loginAs('hq')

    await page.click('.btn-logout')

    await expect(page).toHaveURL('/login')
  })

  test('redirects back to /login after logout when accessing a protected route', async ({ page, loginAs }) => {
    await loginAs('hq')
    await page.click('.btn-logout')

    await page.goto('/dashboard')

    await expect(page).toHaveURL('/login')
  })
})
