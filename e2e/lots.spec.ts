import { test, expect } from './fixtures'

test.describe('Lot list', () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('hq')
  })

  test('loads and displays a list of lots', async ({ page }) => {
    await page.goto('/lots')

    const table = page.locator('table')
    await expect(table).toBeVisible()

    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible()
  })

  test('shows the page heading', async ({ page }) => {
    await page.goto('/lots')

    await expect(page.locator('h2')).toBeVisible()
  })

  test('lot detail page is accessible from the lot list', async ({ page }) => {
    await page.goto('/lots')

    await expect(page.locator('tbody tr').first()).toBeVisible()

    await page.locator('.btn-detail').first().click()

    await expect(page).toHaveURL(/\/lots\/.+/)
    await expect(page.locator('.back-link')).toBeVisible()
  })

  test('lot detail page has a back link to the lot list', async ({ page }) => {
    await page.goto('/lots')
    await expect(page.locator('tbody tr').first()).toBeVisible()

    await page.locator('.btn-detail').first().click()

    const backLink = page.locator('.back-link')
    await expect(backLink).toBeVisible()
    await backLink.click()

    await expect(page).toHaveURL('/lots')
  })
})

test.describe('Lot list - RBAC', () => {
  test('farm_manager sees the "+ Create a lot" button', async ({ page, loginAs }) => {
    await loginAs('farm_manager')
    await page.goto('/lots')

    await expect(page.getByRole('link', { name: /create a lot/i })).toBeVisible()
  })

  test('hq user does NOT see the "+ Create a lot" button', async ({ page, loginAs }) => {
    await loginAs('hq')
    await page.goto('/lots')

    await expect(page.getByRole('link', { name: /create a lot/i })).not.toBeVisible()
  })
})
