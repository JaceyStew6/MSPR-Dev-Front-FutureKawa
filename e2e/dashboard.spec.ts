import { test, expect } from './fixtures'

test.describe('Dashboard', () => {
  test('shows the user name after login', async ({ page, loginAs }) => {
    await loginAs('hq')
    await page.goto('/dashboard')

    await expect(page.locator('h2')).toContainText('Hello, Marie Dupont')
  })

  test('shows the correct role label for HQ user', async ({ page, loginAs }) => {
    await loginAs('hq')
    await page.goto('/dashboard')

    await expect(page.locator('.role-label')).toContainText('HQ / Management')
  })

  test('shows the correct role label for farm_manager', async ({ page, loginAs }) => {
    await loginAs('farm_manager')
    await page.goto('/dashboard')

    await expect(page.locator('.role-label')).toContainText('Farm Manager')
  })

  test('shows quick links relevant to the HQ role', async ({ page, loginAs }) => {
    await loginAs('hq')
    await page.goto('/dashboard')

    await expect(page.getByRole('link', { name: 'Global reporting' })).toBeVisible()
    await expect(page.locator('.quick-link', { hasText: 'View lots' })).toBeVisible()
  })

  test('shows quick links relevant to farm_manager', async ({ page, loginAs }) => {
    await loginAs('farm_manager')
    await page.goto('/dashboard')

    await expect(page.getByRole('link', { name: 'My Farm' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Create a lot' })).toBeVisible()
  })

  test('clicking "View lots" navigates to the lots list', async ({ page, loginAs }) => {
    await loginAs('hq')
    await page.goto('/dashboard')

    await page.getByRole('link', { name: 'View lots' }).first().click()

    await expect(page).toHaveURL('/lots')
  })
})
