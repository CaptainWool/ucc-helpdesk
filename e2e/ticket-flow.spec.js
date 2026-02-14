import { test, expect } from '@playwright/test';

test.describe('Ticket Lifecycle', () => {
    test.beforeEach(async ({ page }) => {
        // Log in as student before each test
        await page.goto('/login');
        await page.fill('input[type="email"]', 'student@ucc.edu.gh');
        await page.fill('input[type="password"]', 'israel_student');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*dashboard/);
    });

    test('should allow a student to submit a new ticket', async ({ page }) => {
        // Go to submit ticket page
        await page.click('text=New Ticket');
        await expect(page).toHaveURL(/.*submit-ticket/);

        // Fill the form
        await page.fill('input[name="subject"]', 'E2E Test Ticket');
        await page.selectOption('select[name="type"]', 'portal');
        await page.fill('textarea[name="description"]', 'This is a test ticket created by Playwright.');

        // Submit
        await page.click('button[type="submit"]');

        // Confirm success
        await expect(page.locator('.success-card')).toBeVisible();
        await expect(page.locator('h1')).toContainText('Submitted');
    });
});
