import { expect, test } from '@playwright/test'

test.describe('home page', () => {
  test('loads without an error status', async ({ page }) => {
    const response = await page.goto('/')

    expect(response?.status()).toBe(200)
  })

  test('renders the main landmark', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('main')).toBeVisible()
  })
})
