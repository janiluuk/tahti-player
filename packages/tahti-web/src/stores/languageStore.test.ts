// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LANGUAGE_STORAGE_KEY, useLanguageStore } from './languageStore';

describe('languageStore', () => {
  afterEach(async () => {
    vi.restoreAllMocks();
    localStorage.removeItem(LANGUAGE_STORAGE_KEY);
    await useLanguageStore.getState().setChoice('en_US');
  });

  const rehydrate = async (saved: unknown) => {
    localStorage.setItem(
      LANGUAGE_STORAGE_KEY,
      JSON.stringify({ state: saved, version: 0 }),
    );
    await useLanguageStore.persist.rehydrate();
  };

  it('keeps a language picked by an older build', async () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fi-FI']);
    await rehydrate({ locale: 'en_US' });
    expect(useLanguageStore.getState().choice).toBe('en_US');
    expect(useLanguageStore.getState().locale).toBe('en_US');
  });

  it('follows the browser on auto', async () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fi-FI']);
    await rehydrate({ choice: 'auto' });
    expect(useLanguageStore.getState().locale).toBe('fi_FI');
  });
});
