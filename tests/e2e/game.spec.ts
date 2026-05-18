import { test, expect } from '@playwright/test';

test.describe('Game Engine Bridge Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Authenticate as guest before game tests
        await page.goto('/login');
        await page.locator('button', { hasText: 'Play as Guest' }).click();
        await expect(page).toHaveURL(/.*\/game.*/);
    });

    test('should render the Phaser canvas and React HUD', async ({ page }) => {
        // The dynamic import shows "Loading Engine..." then renders the canvas
        // Wait for the phaser container to appear
        const phaserContainer = page.locator('#phaser-container');
        await expect(phaserContainer).toBeVisible({ timeout: 10000 });

        // Ensure the canvas element inside the phaser container is injected
        const canvas = phaserContainer.locator('canvas').first();
        await expect(canvas).toBeAttached();

        // Ensure the React HUD Overlay is floating on top
        const hud = page.locator('text=HUD Overlay');
        await expect(hud).toBeVisible();
    });
});
