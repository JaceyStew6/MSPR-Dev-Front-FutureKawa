import { test as base, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'

export const CREDENTIALS = {
  farm_manager: 'farm@futurekawa.com',
  warehouse_manager: 'warehouse@futurekawa.com',
  quality: 'quality@futurekawa.com',
  supply_chain: 'supply@futurekawa.com',
  hq: 'hq@futurekawa.com',
} as const

type Role = keyof typeof CREDENTIALS

type AppFixtures = {
  loginPage: LoginPage
  loginAs: (role: Role) => Promise<void>
}

export const test = base.extend<AppFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page))
  },

  loginAs: async ({ page }, use) => {
    const loginPage = new LoginPage(page)

    const loginAs = async (role: Role) => {
      await loginPage.loginAs(CREDENTIALS[role])
      await page.waitForURL((url) => !url.pathname.endsWith('/login'))
    }

    await use(loginAs)
  },
})

export { expect }
