import { expect, test, type Page } from '@playwright/test';

test.describe('DigiVerse Arena smoke', () => {
  test('loads data, images, arena and tournaments', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Scan. Evolve. Battle.' })).toBeVisible();
    await expect(page.locator('.daily__img')).toBeVisible();
    await expectNoBrokenVisibleImages(page);

    await page.goto('/dex');
    await expect(page.locator('.monster-card').first()).toBeVisible();
    await expectNoBrokenVisibleImages(page);

    await page.goto('/dex/1');
    await expect(page.locator('.detail-hero')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Agumon' })).toBeVisible();
    await expectNoBrokenVisibleImages(page);

    await page.goto('/team-builder');
    await expect(page.getByRole('heading', { name: 'Team Score' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Stable Link|Prime Circuit|Patch Link|Apex Sync|Static Link/ })).toBeVisible();
    await expectNoBrokenVisibleImages(page);

    await page.goto('/nexus');
    await expect(page.getByRole('heading', { name: 'Protocol lab for team chemistry' })).toBeVisible();
    await page.getByRole('button', { name: 'Field Core' }).click();
    await expect(page.getByText('Nexus Contracts')).toBeVisible();
    await expectNoBrokenVisibleImages(page);

    await page.goto('/arena');
    await expect(page.getByRole('heading', { name: 'Local-first PvE command battles' })).toBeVisible();
    await page.getByRole('button', { name: 'Start battle' }).first().click();
    await expect(page.getByRole('heading', { name: /Stable Link|Prime Circuit|Patch Link|Apex Sync|Static Link/ })).toBeVisible();
    await expect(page.locator('.battle-stage')).toBeVisible();
    await expect(page.locator('.log__line').last()).toContainText('Battle ended');
    await expectNoBrokenVisibleImages(page);

    await page.goto('/tournaments');
    await expect(page.getByRole('heading', { name: 'Grand Circuit Tournament Mode' })).toBeVisible();
    await page.getByRole('button', { name: 'Run bracket' }).first().click();
    await expect(page.locator('text=Champion:')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Story Feed' })).toBeVisible();
    await expect.poll(() => page.locator('.story-beat').count()).toBeGreaterThanOrEqual(2);

    expect(pageErrors).toEqual([]);
    expect(consoleErrors.filter((entry) => !entry.includes('favicon'))).toEqual([]);
  });
});

async function expectNoBrokenVisibleImages(page: Page): Promise<void> {
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          Array.from(document.images)
            .filter((img) => {
              const rect = img.getBoundingClientRect();
              return rect.width > 0 && rect.height > 0 && rect.bottom >= 0 && rect.top <= window.innerHeight;
            })
            .filter((img) => !img.complete || img.naturalWidth === 0)
            .map((img) => img.alt || img.currentSrc || img.src),
        ),
      { timeout: 10_000 },
    )
    .toEqual([]);
}
