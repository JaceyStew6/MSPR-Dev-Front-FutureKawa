# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: alerts.spec.ts >> Alerts >> can mark an alert as read
- Location: e2e\alerts.spec.ts:25:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.alert-list')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.alert-list')

```

```yaml
- navigation:
  - link "🌿 FutureKawa":
    - /url: /hq
  - list:
    - listitem:
      - link "Quality":
        - /url: /quality
    - listitem:
      - link "Supply Chain":
        - /url: /supply-chain
    - listitem
  - link "? Help":
    - /url: /user-guide.pdf
  - text: Marie Dupont ·
  - emphasis: hq
  - button "Log out"
- main:
  - heading "Alerts" [level=2]
  - checkbox "Active only" [checked]
  - text: Active only
  - combobox:
    - option "- All types -" [selected]
    - option "Out of range (temperature/humidity)"
    - option "Expiry (> 365 days)"
    - option "FIFO at risk"
  - text: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
- img
- img
```

# Test source

```ts
  1  | import { test, expect } from './fixtures'
  2  | 
  3  | test.describe('Alerts', () => {
  4  |   test.beforeEach(async ({ loginAs }) => {
  5  |     await loginAs('hq')
  6  |   })
  7  | 
  8  |   test('loads the alerts page with a heading', async ({ page }) => {
  9  |     await page.goto('/alerts')
  10 | 
  11 |     await expect(page.locator('h2')).toBeVisible()
  12 |   })
  13 | 
  14 |   test('shows alert rows or the empty state', async ({ page }) => {
  15 |     await page.goto('/alerts')
  16 | 
  17 |     await expect(page.locator('.alert-list')).toBeVisible()
  18 | 
  19 |     const hasAlerts = (await page.locator('.alert-item').count()) > 0
  20 |     const hasEmpty = await page.locator('.empty').isVisible().catch(() => false)
  21 | 
  22 |     expect(hasAlerts || hasEmpty).toBe(true)
  23 |   })
  24 | 
  25 |   test('can mark an alert as read', async ({ page }) => {
  26 |     await page.goto('/alerts')
  27 | 
> 28 |     await expect(page.locator('.alert-list')).toBeVisible()
     |                                               ^ Error: expect(locator).toBeVisible() failed
  29 | 
  30 |     const markReadBtn = page.locator('.btn-read').first()
  31 | 
  32 |     if (!(await markReadBtn.isVisible())) {
  33 |       test.skip()
  34 |       return
  35 |     }
  36 | 
  37 |     await markReadBtn.click()
  38 | 
  39 |     await expect(page.locator('.read-label').first()).toBeVisible()
  40 |   })
  41 | 
  42 |   test('type filter changes the visible alerts', async ({ page }) => {
  43 |     await page.goto('/alerts')
  44 | 
  45 |     const typeFilter = page.locator('select').first()
  46 |     await typeFilter.selectOption('threshold')
  47 | 
  48 |     await expect(page).toHaveURL('/alerts')
  49 |   })
  50 | })
  51 | 
  52 | test.describe('Alerts navigation', () => {
  53 |   test('nav link leads to alerts page', async ({ page, loginAs }) => {
  54 |     await loginAs('hq')
  55 |     await page.goto('/dashboard')
  56 | 
  57 |     await page.getByRole('link', { name: 'View alerts' }).click()
  58 | 
  59 |     await expect(page).toHaveURL('/alerts')
  60 |   })
  61 | })
  62 | 
```