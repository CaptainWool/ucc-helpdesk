import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Student Signup Flow', () => {
    test('should allow a student to sign up through the 3-step wizard', async ({ page }) => {
        await page.goto('/student-signup');

        const timestamp = Date.now();
        const testEmail = `student_${timestamp}@student.ucc.edu.gh`;

        // Step 1: Profile
        await expect(page.getByText('Profile Setup')).toBeVisible();

        // Upload avatar
        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.click('.avatar-preview-large');
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles(path.join(process.cwd(), 'dummy-avatar.png'));

        await page.fill('input[name="fullName"]', 'E2E Test Student');
        await page.fill('input[name="studentId"]', `SID${timestamp}`);
        await page.fill('input[name="phoneNumber"]', '0241234567');
        await page.click('text=Next Step');

        // Step 2: Details
        await expect(page.getByText('Academic Details')).toBeVisible();
        await page.selectOption('select[name="level"]', '200');
        await page.fill('input[name="programme"]', 'B.Sc. Computer Science');
        await page.fill('input[name="email"]', testEmail);
        await page.click('text=Next Step');

        // Step 3: Security
        await expect(page.getByText('Account Security')).toBeVisible();
        await page.fill('input[id="password"]', 'StrongPass123!');
        await page.fill('input[id="confirmPassword"]', 'StrongPass123!');

        await page.click('button[type="submit"]');

        // Check success screen
        await expect(page.getByText('Account Created!')).toBeVisible({ timeout: 15000 });
        await expect(page.getByText('E2E Test Student')).toBeVisible();

        // Final action
        await page.click('text=Go to Login');
        await expect(page).toHaveURL(/.*login/);
    });
});
