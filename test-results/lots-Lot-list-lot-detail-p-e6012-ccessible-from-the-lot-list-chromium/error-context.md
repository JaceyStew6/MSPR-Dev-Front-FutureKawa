# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: lots.spec.ts >> Lot list >> lot detail page is accessible from the lot list
- Location: e2e\lots.spec.ts:24:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('.btn-detail').first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - navigation [ref=e4]:
      - link "🌿 FutureKawa" [ref=e6] [cursor=pointer]:
        - /url: /hq
      - list [ref=e7]:
        - listitem [ref=e8]:
          - link "Quality" [ref=e9] [cursor=pointer]:
            - /url: /quality
        - listitem [ref=e10]:
          - link "Supply Chain" [ref=e11] [cursor=pointer]:
            - /url: /supply-chain
        - listitem
      - generic [ref=e12]:
        - link "? Help" [ref=e13] [cursor=pointer]:
          - /url: /user-guide.pdf
        - generic [ref=e14]:
          - text: Marie Dupont ·
          - emphasis [ref=e15]: hq
        - button "Log out" [ref=e16] [cursor=pointer]
    - main [ref=e17]:
      - generic [ref=e18]:
        - heading "Coffee lots" [level=2] [ref=e20]
        - generic [ref=e21]:
          - generic [ref=e22]:
            - combobox [ref=e23]:
              - option "- All countries -" [selected]
            - combobox [ref=e24]:
              - option "- All farms -" [selected]
            - combobox [ref=e25]:
              - option "- All warehouses -" [selected]
            - combobox [disabled] [ref=e26]:
              - option "- All zones -" [selected]
            - button "Reset" [ref=e27] [cursor=pointer]
          - combobox [ref=e28]:
            - option "- All statuses -" [selected]
        - table [ref=e30]:
          - rowgroup [ref=e31]:
            - row "Lot No. Country Farm Warehouse Zone Production date Storage date ↑ (FIFO) Status Latest reading" [ref=e32]:
              - columnheader "Lot No." [ref=e33]
              - columnheader "Country" [ref=e34]
              - columnheader "Farm" [ref=e35]
              - columnheader "Warehouse" [ref=e36]
              - columnheader "Zone" [ref=e37]
              - columnheader "Production date" [ref=e38]
              - columnheader "Storage date ↑ (FIFO)" [ref=e39]
              - columnheader "Status" [ref=e40]
              - columnheader "Latest reading" [ref=e41]
              - columnheader [ref=e42]
          - rowgroup [ref=e43]:
            - row "No lots found" [ref=e44]:
              - cell "No lots found" [ref=e45]
  - generic [ref=e46]:
    - generic "Toggle devtools panel" [ref=e47] [cursor=pointer]:
      - img [ref=e48]
    - generic "Toggle Component Inspector" [ref=e53] [cursor=pointer]:
      - img [ref=e54]
```

# Test source

```ts
  1  | import { test, expect } from './fixtures'
  2  | 
  3  | test.describe('Lot list', () => {
  4  |   test.beforeEach(async ({ loginAs }) => {
  5  |     await loginAs('hq')
  6  |   })
  7  | 
  8  |   test('loads and displays a list of lots', async ({ page }) => {
  9  |     await page.goto('/lots')
  10 | 
  11 |     const table = page.locator('table')
  12 |     await expect(table).toBeVisible()
  13 | 
  14 |     const rows = page.locator('tbody tr')
  15 |     await expect(rows.first()).toBeVisible()
  16 |   })
  17 | 
  18 |   test('shows the page heading', async ({ page }) => {
  19 |     await page.goto('/lots')
  20 | 
  21 |     await expect(page.locator('h2')).toBeVisible()
  22 |   })
  23 | 
  24 |   test('lot detail page is accessible from the lot list', async ({ page }) => {
  25 |     await page.goto('/lots')
  26 | 
  27 |     await expect(page.locator('tbody tr').first()).toBeVisible()
  28 | 
> 29 |     await page.locator('.btn-detail').first().click()
     |                                               ^ Error: locator.click: Test timeout of 30000ms exceeded.
  30 | 
  31 |     await expect(page).toHaveURL(/\/lots\/.+/)
  32 |     await expect(page.locator('.back-link')).toBeVisible()
  33 |   })
  34 | 
  35 |   test('lot detail page has a back link to the lot list', async ({ page }) => {
  36 |     await page.goto('/lots')
  37 |     await expect(page.locator('tbody tr').first()).toBeVisible()
  38 | 
  39 |     await page.locator('.btn-detail').first().click()
  40 | 
  41 |     const backLink = page.locator('.back-link')
  42 |     await expect(backLink).toBeVisible()
  43 |     await backLink.click()
  44 | 
  45 |     await expect(page).toHaveURL('/lots')
  46 |   })
  47 | })
  48 | 
  49 | test.describe('Lot list - RBAC', () => {
  50 |   test('farm_manager sees the "+ Create a lot" button', async ({ page, loginAs }) => {
  51 |     await loginAs('farm_manager')
  52 |     await page.goto('/lots')
  53 | 
  54 |     await expect(page.getByRole('link', { name: /create a lot/i })).toBeVisible()
  55 |   })
  56 | 
  57 |   test('hq user does NOT see the "+ Create a lot" button', async ({ page, loginAs }) => {
  58 |     await loginAs('hq')
  59 |     await page.goto('/lots')
  60 | 
  61 |     await expect(page.getByRole('link', { name: /create a lot/i })).not.toBeVisible()
  62 |   })
  63 | })
  64 | 
```