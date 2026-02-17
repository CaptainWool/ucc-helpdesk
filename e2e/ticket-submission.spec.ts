
import { test, expect } from '@playwright/test';

test.describe('Ticket Submission Flow', () => {
    test('should submit a ticket and show success toast', async ({ page }) => {
        // 1. Login
        await page.goto('/login');
        await page.fill('input[type="email"]', 'student@example.com'); // Adjust credential as needed
        await page.fill('input[type="password"]', 'student123');
        await page.click('button:has-text("Sign In")');

        // Wait for dashboard
        await expect(page).toHaveURL('/dashboard');

        // 2. Navigate to Submit Ticket
        await page.click('a[href="/submit-ticket"]');

        // 3. Step 1: Category
        await page.click('text=Academic Affairs');
        await page.click('button:has-text("Next")');

        // 4. Step 2: Details
        await page.fill('input[name="subject"]', 'Test Ticket via Playwright');
        await page.fill('textarea[name="description"]', 'This is an automated test ticket.');
        await page.selectOption('select[name="priority"]', 'Medium');
        await page.click('button:has-text("Next")');

        // 5. Step 3: Review & Confirm
        await expect(page.locator('text=Review Your Ticket')).toBeVisible();
        await page.click('button:has-text("Submit Ticket")');

        // 6. Verification (The Toast Issue)
        // The issue is likely here: we expect a success message, but navigation might happen too fast.
        // We'll try to catch the toast.
        const toast = page.locator('.toast-success'); // Adjust selector based on actual Toast implementation
        await expect(toast).toBeVisible({ timeout: 5000 });
        await expect(toast).toContainText('Ticket submitted successfully');

        // 7. Verify navigation to Success Page or Dashboard
        // await expect(page).toHaveURL(/.*success.*/); 
    });
});
