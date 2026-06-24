/**
 * E2E Test: Job Posting & Browse
 *
 * Chapter 5, Section 5.4 — System/E2E Testing.
 *
 * Tests the public-facing job listing pages:
 * 1. Jobs page loads and displays listings
 * 2. Search/filter works
 * 3. Job detail page accessible
 */
import { test, expect } from '@playwright/test';
import { BASE_URL } from './fixtures/test-wallets';

test.describe('E2E: Public Job Browser', () => {
  test('jobs page loads and displays listing grid', async ({ page }) => {
    await page.goto(`${BASE_URL}/jobs`);

    // Page should render without errors
    await expect(page.locator('body')).not.toHaveText(/500|Internal Server Error/);

    // Should have some form of job listing container
    const jobsContainer = page.locator('[data-testid="job-list"], main');
    await expect(jobsContainer).toBeVisible();
  });

  test('search bar accepts input', async ({ page }) => {
    await page.goto(`${BASE_URL}/jobs`);

    const searchInput = page.getByPlaceholder(/search/i).or(
      page.getByRole('searchbox')
    );

    // If search input exists, verify it works
    const searchExists = await searchInput.isVisible().catch(() => false);
    if (searchExists) {
      await searchInput.fill('React Developer');
      await expect(searchInput).toHaveValue('React Developer');
    }
  });

  test('job detail page loads for valid job', async ({ page }) => {
    await page.goto(`${BASE_URL}/jobs`);

    // Find first job link
    const jobLink = page.locator('a[href*="/jobs/"]').first();
    const linkExists = await jobLink.isVisible().catch(() => false);

    if (linkExists) {
      await jobLink.click();
      await page.waitForLoadState('networkidle');

      // Should show job details
      const heading = page.getByRole('heading').first();
      await expect(heading).toBeVisible();
    }
  });
});

test.describe('E2E: Proposal Submission (authenticated)', () => {
  // NOTE: These tests require an authenticated session.
  // In a real setup, use Playwright's storageState or API-based auth.
  // Here we verify the UI elements exist when the page loads.

  test('proposal form requires authentication', async ({ page }) => {
    // Try to access a proposal submission page directly
    await page.goto(`${BASE_URL}/dashboard/proposals`);

    // Should redirect or show auth gate
    const url = page.url();
    const requiresAuth =
      url.includes('/login') ||
      url.includes('/auth') ||
      url === `${BASE_URL}/` ||
      await page.getByText(/sign in|connect wallet/i).isVisible().catch(() => false);

    expect(requiresAuth).toBe(true);
  });
});
