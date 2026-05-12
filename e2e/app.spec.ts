import { test, expect } from '@playwright/test';

test.describe('App', () => {
  test('login form is shown when unauthenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Accedi' })).toBeVisible();
    await expect(page.locator('text=Casa Criscuolo')).toBeVisible();
  });

  test('page has correct title and theme color', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title).toBe('Casa Criscuolo / Falabella');
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
    expect(themeColor).toBe('#C4622D');
  });

  test('login form has email, password and submit button', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Accedi' })).toBeVisible();
  });

  test('login form has register and reset password links', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Registrati')).toBeVisible();
    await expect(page.locator('text=Password dimenticata?')).toBeVisible();
  });
});
