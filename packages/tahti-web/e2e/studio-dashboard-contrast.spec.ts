import { expect, test } from '@playwright/test';

import { signIn } from './helpers/auth';

for (const width of [390, 1440]) {
  test(`Studio actions remain readable at ${width}px across themes`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await signIn(page);
    await page.goto('/studio');
    await expect(
      page.getByRole('heading', { name: 'Studio', exact: true, level: 1 }),
    ).toBeVisible();
    const upload = page.getByRole('link', { name: 'Upload', exact: true });
    const create = page.getByRole('link', {
      name: 'Create release',
      exact: true,
    });
    await expect(upload).toHaveAttribute('href', '/studio/upload');
    await expect(create).toHaveAttribute(
      'href',
      '/studio/releases?create=true',
    );
    await expect(page.getByTestId('studio-action-tile')).toHaveCount(5);
    await expect(
      page.getByRole('navigation', { name: 'Studio pages' }),
    ).toBeVisible();
    const themes = [
      'nuclear:default',
      'nuclear:aurora',
      'nuclear:ember',
      'nuclear:lagoon',
      'nuclear:arctic-moss',
      'nuclear:tahti-dark',
      'custom:gruvbox',
    ];
    for (const theme of themes) {
      for (const mode of ['light', 'dark']) {
        await page.evaluate(
          async ({ theme, mode }) => {
            const modulePath = '/src/plugins/themes/store.ts';
            const { useThemeStore } = await import(modulePath);
            useThemeStore.getState().setTheme(theme);
            useThemeStore.getState().setColorMode(mode);
          },
          { theme, mode },
        );
        for (const button of [upload, create]) {
          await expect(button).toBeVisible();
          await expect
            .poll(
              () =>
                button.evaluate((element) => {
                  const style = getComputedStyle(element);
                  const context = document
                    .createElement('canvas')
                    .getContext('2d')!;
                  const luminance = (color: string) => {
                    context.clearRect(0, 0, 1, 1);
                    context.fillStyle = color;
                    context.fillRect(0, 0, 1, 1);
                    const rgb = Array.from(
                      context.getImageData(0, 0, 1, 1).data,
                    )
                      .slice(0, 3)
                      .map((value) => {
                        const channel = value / 255;
                        return channel <= 0.04045
                          ? channel / 12.92
                          : ((channel + 0.055) / 1.055) ** 2.4;
                      });
                    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
                  };
                  const foreground = luminance(style.color);
                  const background = luminance(style.backgroundColor);
                  return (
                    (Math.max(foreground, background) + 0.05) /
                    (Math.min(foreground, background) + 0.05)
                  );
                }),
              { message: `${theme} ${mode} button contrast` },
            )
            .toBeGreaterThanOrEqual(4.5);
        }
      }
    }
    await page.mouse.move(0, 0);
    const idle = await upload.evaluate(
      (element) => getComputedStyle(element).filter,
    );
    await upload.hover();
    await expect
      .poll(() =>
        upload.evaluate((element) => getComputedStyle(element).filter),
      )
      .not.toBe(idle);
    await page.mouse.move(0, 0);
    const bounds = await create.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: testInfo.outputPath(`studio-dashboard-${width}.png`),
      fullPage: true,
    });
  });
}
