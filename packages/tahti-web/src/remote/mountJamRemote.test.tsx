// @vitest-environment jsdom
import { act, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { i18n } from '@tahti-player/i18n';

import { applyLocale } from '../lib/locale';
import { mountJamRemote } from './mountJamRemote';

async function mount() {
  const root = document.createElement('div');
  document.body.append(root);
  await act(async () => {
    await mountJamRemote(root);
  });
  return root;
}

describe('mountJamRemote', () => {
  afterEach(async () => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
    await applyLocale('en_US');
  });

  it('follows a Finnish phone', async () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fi-FI', 'en']);
    await mount();
    expect(i18n.language).toBe('fi_FI');
    expect(document.documentElement.lang).toBe('fi-FI');
    expect(await screen.findByText('Laitetta ei ole paritettu')).toBeTruthy();
  });

  it('stays in English otherwise', async () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['sv-SE', 'de']);
    await mount();
    expect(i18n.language).toBe('en_US');
    expect(await screen.findByText('This device isn’t paired')).toBeTruthy();
  });
});
