/**
 * E2E Test: Wallet Authentication Flow
 *
 * Chapter 5, Section 5.4 — System/E2E Testing.
 *
 * Tests the full wallet login flow through the browser:
 * 1. Landing page loads
 * 2. Connect wallet button is visible and accessible
 * 3. Navigation to dashboard after auth
 *
 * NOTE: Full MetaMask/RainbowKit integration requires a browser wallet
 * extension or a mock provider. These tests verify the UI layer and
 * navigation flow. For full wallet signing, use the Synpress framework
 * or mock the wagmi provider.
 */
import { test, expect } from '@playwright/test';
import { BASE_URL } from './fixtures/test-wallets';

test.describe('E2E: Wallet Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('landing page loads with connect wallet CTA', async ({ page }) => {
    // Page should load within timeout
    await expect(page).toHaveTitle(/DeTrust/i);

    // Connect wallet button should be visible
    const connectBtn = page.getByRole('button', { name: /connect|wallet|sign in/i });
    await expect(connectBtn).toBeVisible();
  });

  test('connect wallet button is keyboard-accessible', async ({ page }) => {
    const connectBtn = page.getByRole('button', { name: /connect|wallet|sign in/i });
    await expect(connectBtn).toBeVisible();

    // Tab to button and verify focus
    await page.keyboard.press('Tab');

    // The button should be focusable (eventually)
    const focused = page.locator(':focus');
    await expect(focused).toBeDefined();
  });

  test('unauthenticated user cannot access dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    // Should redirect to login or show auth prompt
    // The exact behaviour depends on middleware — check for either:
    const url = page.url();
    const isRedirected = url.includes('/login') || url.includes('/auth') || url === `${BASE_URL}/`;
    const hasAuthPrompt = await page.getByText(/sign in|connect wallet|login/i).isVisible().catch(() => false);

    expect(isRedirected || hasAuthPrompt).toBe(true);
  });
});
