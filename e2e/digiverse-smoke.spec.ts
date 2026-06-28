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
    await expect(page.getByRole('heading', { name: 'Agumon', exact: true })).toBeVisible();
    await expect(page.getByText('Idea Deck')).toBeVisible();
    await page.getByRole('button', { name: 'Favorite' }).click();
    await page.getByPlaceholder('Add a build idea').fill('Starter anchor for campaign smoke.');
    await page.getByRole('button', { name: 'Save note' }).click();
    await expect(page.getByText('Note saved to Collection.')).toBeVisible();
    await expectNoBrokenVisibleImages(page);

    await page.goto('/minigames');
    await expect(page.getByRole('heading', { name: 'Mini-Games from live DAPI signals' })).toBeVisible();
    await page.locator('.choice-card').first().click();
    await expect(page.getByRole('status')).toBeVisible();
    await expectNoBrokenVisibleImages(page);

    await page.goto('/rivals');
    await expect(page.getByRole('heading', { name: 'Daily Nemesis Bounty' })).toBeVisible();
    await expect(page.locator('.rival-theater')).toBeVisible();
    await page.getByRole('button', { name: 'Run bounty duel' }).click();
    await expect(page.locator('.rival-result')).toBeVisible();
    await expect(page.locator('.rival-result')).toContainText('Counter read');
    await expectNoBrokenVisibleImages(page);

    await page.goto('/expeditions');
    await expect(page.getByRole('heading', { name: 'Field Expedition Routes' })).toBeVisible();
    await expect(page.locator('.expedition-theater')).toBeVisible();
    await page.getByRole('button', { name: 'Run expedition' }).click();
    await expect(page.locator('.expedition-result')).toBeVisible();
    await expect(page.locator('.expedition-result')).toContainText('Outcome');
    await expectNoBrokenVisibleImages(page);

    await page.goto('/skill-forge');
    await expect(page.getByRole('heading', { name: 'Combo Training Dojo' })).toBeVisible();
    await expect(page.locator('.forge-theater')).toBeVisible();
    await page.getByRole('button', { name: 'Run forge drill' }).click();
    await expect(page.locator('.forge-result')).toBeVisible();
    await expect(page.locator('.forge-result')).toContainText('Outcome');
    await expectNoBrokenVisibleImages(page);

    await page.goto('/team-builder');
    await expect(page.getByRole('heading', { name: 'Squad Lab', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Stable Link|Prime Circuit|Patch Link|Apex Sync|Static Link/ })).toBeVisible();
    await page.getByRole('button', { name: 'Run squad drill' }).click();
    await expect(page.locator('.squad-result')).toBeVisible();
    await expect(page.locator('.squad-result')).toContainText('Outcome');
    await expectNoBrokenVisibleImages(page);

    await page.goto('/nexus');
    await expect(page.getByRole('heading', { name: 'Protocol lab for team chemistry' })).toBeVisible();
    await page.getByRole('button', { name: 'Field Core' }).click();
    await expect(page.getByText('Nexus Contracts')).toBeVisible();
    await expectNoBrokenVisibleImages(page);

    await page.goto('/compare');
    await expect(page.getByRole('heading', { name: 'Scouter Duel', exact: true })).toBeVisible();
    await expect(page.locator('.scouter-card').first()).toBeVisible();
    await page.locator('.scouter-card').first().getByRole('button', { name: /Call/ }).click();
    await expect(page.locator('.scouter-result')).toBeVisible();
    await expect(page.locator('.scouter-result')).toContainText('Outcome');
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
    await page.getByRole('button', { name: 'Nexus Overdrive' }).click();
    await page.getByRole('button', { name: 'Run bracket' }).click();
    await expect(page.getByText('Champion: Signal hidden')).toBeVisible();
    await page.locator('.prediction-card').first().click();
    await expect(page.getByRole('status')).toContainText('Prediction locked');
    await expect(page.getByRole('heading', { name: 'Broadcast Moments' })).toBeVisible();
    await expect(page.getByText('Match Spotlight')).toBeVisible();
    await page.getByRole('button', { name: 'Reveal next round' }).first().click();
    await expect(page.locator('text=Champion:')).toBeVisible();
    await page.getByRole('button', { name: 'Claim prediction bonus' }).click();
    await expect(page.getByRole('status')).toContainText('Prediction');
    await expect.poll(() => page.locator('.tournament-match-card').count()).toBeGreaterThanOrEqual(3);
    await page.locator('.tournament-match-card').first().click();
    await expect(page.locator('.spotlight-log p').first()).toBeVisible();
    await page.getByRole('button', { name: /Relic/ }).click();
    await expect(page.getByRole('status')).toContainText('claimed');

    await page.goto('/collection');
    await expect(page.getByRole('heading', { name: 'Favorites' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Rival Bounties' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Field Expeditions' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Skill Forge', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Squad Lab', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Scouter Duels' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Mini-Games' })).toBeVisible();
    await expect(page.getByText('Starter anchor for campaign smoke.')).toBeVisible();
    await expectNoBrokenVisibleImages(page);

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
