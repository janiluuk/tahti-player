// @vitest-environment jsdom
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { MobileBottomNav } from '../../../components/MobileChrome';
import {
  LANGUAGE_STORAGE_KEY,
  useLanguageStore,
} from '../../../stores/languageStore';
import { renderWithRouter } from '../../../test/renderWithRouter';
import { LanguagePanel } from './LanguagePanel';

describe('LanguagePanel', () => {
  afterEach(async () => {
    cleanup();
    await useLanguageStore.getState().setLocale('en_US');
    localStorage.removeItem(LANGUAGE_STORAGE_KEY);
  });

  it('switches the chrome to Finnish and sets the document language', async () => {
    await renderWithRouter(
      <>
        <LanguagePanel />
        <MobileBottomNav />
      </>,
    );
    expect(screen.getByRole('link', { name: 'Listen' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Language/ })).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: /Language/ }));
    await userEvent.click(await screen.findByRole('option', { name: 'Suomi' }));

    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Kuuntele' })).toBeTruthy(),
    );
    expect(screen.getByRole('link', { name: 'Tutki' })).toBeTruthy();
    expect(document.documentElement.lang).toBe('fi-FI');
    expect(screen.getByRole('button', { name: /Kieli/ })).toBeTruthy();
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toContain('fi_FI');
  });
});
