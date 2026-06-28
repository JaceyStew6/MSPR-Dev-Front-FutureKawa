import type { Page } from '@playwright/test'

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login')
  }

  async fillEmail(email: string) {
    await this.page.fill('#email', email)
  }

  async fillPassword(password: string) {
    await this.page.fill('#password', password)
  }

  async submit() {
    await this.page.click('button[type="submit"]')
  }

  async loginAs(email: string, password = 'test') {
    await this.goto()
    await this.fillEmail(email)
    await this.fillPassword(password)
    await this.submit()
  }

  get errorMessage() {
    return this.page.locator('.error')
  }

  get submitButton() {
    return this.page.locator('button[type="submit"]')
  }
}
