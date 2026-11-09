import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { CopyButton, EditIconButton } from '@tahti-player/ui';

import { applyLocale } from '../lib/locale';
import { WebUiLabelsProvider } from './WebUiLabelsProvider';

function renderButtons() {
  render(
    <WebUiLabelsProvider>
      <EditIconButton />
      <EditIconButton editing />
      <CopyButton text="https://tahti.live" />
    </WebUiLabelsProvider>,
  );
}

describe('WebUiLabelsProvider', () => {
  afterEach(async () => {
    cleanup();
    await act(async () => {
      await applyLocale('en_US');
    });
  });

  it('keeps the English defaults in English', () => {
    renderButtons();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Done editing' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Copy' })).toBeTruthy();
  });

  it('gives the shared buttons Finnish names', async () => {
    await act(async () => {
      await applyLocale('fi_FI');
    });
    renderButtons();
    expect(screen.getByRole('button', { name: 'Muokkaa' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Valmis' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Kopioi' })).toBeTruthy();
  });
});
