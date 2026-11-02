import { expect, test, type Page } from '@playwright/test';

import { acknowledgeGuidelines, signIn } from './helpers/auth';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page);
});

async function open(page: Page, path: string) {
  await page.goto(path);
  await acknowledgeGuidelines(page);
}

const main = (page: Page) => page.getByRole('main');

function tinyWav(): Buffer {
  const dataBytes = 800;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataBytes, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(8000, 24);
  header.writeUInt32LE(16000, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataBytes, 40);
  return Buffer.concat([header, Buffer.alloc(dataBytes)]);
}

test('artist: uploads a track and lands on its page', async ({ page }) => {
  await open(page, '/library/upload');
  const upload = main(page).getByRole('button', { name: 'Upload file' });
  await expect(upload).toBeDisabled();
  await page.locator('input[type=file]').first().setInputFiles({
    name: 'e2e-take.wav',
    mimeType: 'audio/wav',
    buffer: tinyWav(),
  });
  await expect(main(page).getByText('e2e-take.wav')).toBeVisible();
  await upload.click();
  await expect(page).toHaveURL(/\/studio\/sounds\//);
  await expect(
    page.getByRole('heading', { level: 1, name: 'e2e-take' }),
  ).toBeVisible();
});

test('artist: creates a release and opens it', async ({ page }) => {
  const title = `Night Walks ${Date.now()}`;
  await open(page, '/studio/releases');
  await main(page).getByRole('button', { name: 'New release' }).click();
  const dialog = page.getByRole('dialog', { name: 'New release' });
  const create = dialog.getByRole('button', { name: 'Create' });
  await expect(create).toBeDisabled();
  await dialog.getByRole('textbox', { name: 'Title' }).fill(title);
  await create.click();
  await expect(page.getByText(title).first()).toBeVisible();
});

test('artist: saves a newsletter draft', async ({ page }) => {
  const subject = `November notes ${Date.now()}`;
  await open(page, '/studio/updates?tab=newsletter');
  await main(page).getByRole('button', { name: 'New draft' }).click();
  const dialog = page.getByRole('dialog', { name: 'New draft' });
  await dialog.getByRole('textbox', { name: 'Subject' }).fill(subject);
  await dialog
    .getByRole('textbox', { name: 'Body (markdown)' })
    .fill('New EP out Friday.');
  await dialog.getByRole('button', { name: 'Save draft' }).click();
  await expect(main(page).getByText(subject)).toBeVisible();
});

test('artist: saves the profile story', async ({ page }) => {
  const story = `Started on a borrowed synth ${Date.now()}.`;
  await open(page, '/settings/artist?tab=story');
  const dialog = page.getByRole('dialog', { name: 'Settings' });
  await dialog.getByRole('textbox', { name: 'Your story' }).fill(story);
  await dialog.getByRole('button', { name: 'Save story' }).click();
  await expect(page.getByText('Artist info saved.')).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: 'Your story' })).toHaveValue(
    story,
  );
});

test('artist: renames a track in the track editor', async ({ page }) => {
  const title = `Studio sketch B ${Date.now()}`;
  await open(page, '/library/sounds');
  await main(page)
    .getByRole('button', { name: 'Edit Studio sketch A' })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Edit track' });
  await dialog.getByRole('textbox', { name: 'Title' }).fill(title);
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Track details saved.')).toBeVisible();
  await expect(dialog).toBeHidden();
  await expect(page.getByText(title).first()).toBeAttached();
  await expect(
    main(page).getByRole('button', { name: 'Edit Studio sketch A' }),
  ).toHaveCount(0);
});
