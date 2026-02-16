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

        // Step 1: Identify
        await page.click('.wizard-btn-next');

        // Step 2: Describe
        await page.fill('input[name="subject"]', 'E2E Test Ticket');
        await page.selectOption('select[name="type"]', 'Portal Access');
        await page.fill('textarea[name="description"]', 'This is a test ticket created by Playwright.');
        await page.click('.wizard-btn-next');

        // Step 3: Evidence (Skip)
        await page.click('.wizard-btn-next');

        // Step 4: Review
        await expect(page.getByText('Review Your Concern', { exact: false })).toBeVisible();
        await page.click('.wizard-btn-submit');

        // Confirm success via toast and redirection
        await expect(page.getByText(/submitted successfully/i)).toBeVisible();
        await expect(page).toHaveURL(/.*dashboard/);
    });
});
