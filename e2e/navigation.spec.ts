import { test, expect } from './fixtures'

test.describe('Role-based navigation guard', () => {
  test('farm_manager is redirected away from /warehouse', async ({ page, loginAs }) => {
    await loginAs('farm_manager')
    await page.goto('/warehouse')

    await expect(page).toHaveURL('/dashboard')
  })

  test('hq user can access /supply-chain', async ({ page, loginAs }) => {
    await loginAs('hq')
    await page.goto('/supply-chain')

    await expect(page).toHaveURL('/supply-chain')
    await expect(page.locator('h2')).toContainText('Supply Chain')
  })

  test('quality user can access /quality', async ({ page, loginAs }) => {
    await loginAs('quality')
    await page.goto('/quality')

    await expect(page).toHaveURL('/quality')
    await expect(page.locator('h2')).toContainText('Quality')
  })

  test('quality user is redirected away from /farm', async ({ page, loginAs }) => {
    await loginAs('quality')
    await page.goto('/farm')

    await expect(page).toHaveURL('/dashboard')
  })

  test('AppNav is visible for authenticated users', async ({ page, loginAs }) => {
    await loginAs('hq')
    await page.goto('/dashboard')

    await expect(page.locator('nav')).toBeVisible()
  })
})
