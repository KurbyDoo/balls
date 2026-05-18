import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('homepage has correct titles and links', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('h1')).toContainText('Jam/Sort');

        const playButton = page.locator('a', { hasText: 'Play Now' });
        await expect(playButton).toBeVisible();
    });

    test('redirects to login when accessing game without session', async ({ page }) => {
        // Try traversing directly to /game
        await page.goto('/game');

        // Middleware should intercept and redirect to /login
        await expect(page).toHaveURL(/.*\/login.*/);
        await expect(page.locator('form').first()).toBeVisible();
    });

    test('guest login navigates to the game area', async ({ page }) => {
        await page.goto('/login');

        // Click the "Play as Guest" button
        const guestButton = page.locator('button', { hasText: 'Play as Guest' });
        await expect(guestButton).toBeVisible();
        await guestButton.click();

        // If Anonymous Sign Ins are enabled, we should be directed to the game successfully!
        await expect(page).toHaveURL(/.*\/game.*/);
    });
});
