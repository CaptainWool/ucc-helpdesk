import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('should allow a student to log in and see the dashboard', async ({ page }) => {
        // Capture browser console logs
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
        page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

        // Navigate to student login
        await page.goto('/login');

        // Fill in credentials
        await page.fill('input[type="email"]', 'student@ucc.edu.gh');
        await page.fill('input[type="password"]', 'israel_student');

        // Click login
        await page.click('button[type="submit"]');

        // Check if redirected to dashboard
        await expect(page).toHaveURL(/.*dashboard/);

        // Check for greeting message to confirm successful login
        await expect(page.getByText(/Hello/i)).toBeVisible({ timeout: 15000 });

        // Verify student-specific UI element
        await expect(page.getByText(/New Ticket/i)).toBeVisible();
    });

    test('should redirect unauthenticated users from protected routes', async ({ page }) => {
        // Try to access admin dashboard directly
        await page.goto('/admin');

        // Should be redirected to login
        await expect(page).toHaveURL(/.*login/);
    });

    test('should show error on failed login', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'wrong@example.com');
        await page.fill('input[type="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');

        // Check for error toast or message
        // This assumes a toast component or error message appears
        await expect(page.locator('.toast-error, .error-message')).toBeVisible();
    });

    test('should validate empty login fields', async ({ page }) => {
        await page.goto('/login');
        await page.click('button[type="submit"]');

        // HTML5 validation usually prevents submission, but let's check for any feedback
        const emailInput = page.locator('input[type="email"]');
        const isInvalid = await emailInput.evaluate((node) => node.validity.valueMissing);
        expect(isInvalid).toBeTruthy();
    });
});
