import { test, expect } from '@playwright/test';

test.describe('Ticket Lifecycle', () => {
    test.beforeEach(async ({ page }) => {
        // Capture browser console logs
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
        page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

        // Log in as student before each test
        await page.goto('/login');
        await page.fill('input[type="email"]', 'student@ucc.edu.gh');
        await page.fill('input[type="password"]', 'israel_student');
        await page.click('button[type="submit"]');

        // Wait for URL or error message
        try {
            await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
        } catch (err) {
            const errorText = await page.locator('.error-message').textContent().catch(() => 'No error message seen');
            console.log('Login failed. Error visible on UI:', errorText);
            throw err;
        }
    });

    test('should allow a student to submit a new ticket', async ({ page }) => {
        // Go to submit ticket page
        await page.click('text=New Ticket');
        await expect(page).toHaveURL(/.*submit-ticket/);

        // Step 1: Identify
        await expect(page.getByText('Student Information')).toBeVisible();
        await page.click('.wizard-btn-next');

        // Step 2: Describe
        await expect(page.getByText('Ticket Details')).toBeVisible();
        await page.fill('input[name="subject"]', 'E2E Test Ticket');
        await page.selectOption('select[name="type"]', 'Portal Access');
        await page.fill('textarea[name="description"]', 'This is a test ticket created by Playwright.');
        await page.click('.wizard-btn-next');

        // Step 3: Evidence
        await expect(page.getByText('Attachments & Evidence')).toBeVisible();
        await page.click('.wizard-btn-next');

        // Submit the ticket - it might unmount immediately after click
        await page.locator('.wizard-btn-submit').click({ noWaitAfter: true });

        // Confirm success via success screen text (most persistent element)
        await expect(page.getByText(/successfully/i).first()).toBeVisible({ timeout: 15000 });
        await expect(page).toHaveURL(/.*success=true.*/, { timeout: 10000 });

        // Navigate back to dashboard
        await page.click('text=Go to Dashboard');
    });
});
