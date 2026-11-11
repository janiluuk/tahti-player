import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { EnabledInternetRadioPreset } from '../../api/client';
import { renderWithRouter } from '../../test/renderWithRouter';
import { RadioStationsRow } from './RadioStationsRow';

const ylexPreset: EnabledInternetRadioPreset = {
  id: 'preset-ylex',
  name: 'YleX',
  genre: 'Pop / Hits',
  description: null,
  iconUrl: null,
  programmingUrl: null,
  streamUrl: 'https://example.com/ylex',
};

function renderRow(presets: Parameters<typeof RadioStationsRow>[0]['presets']) {
  return renderWithRouter(
    <RadioStationsRow
      presets={presets}
      setPresets={() => {}}
      onRetry={() => {}}
      signedIn
    />,
  );
}

describe('RadioStationsRow', () => {
  it('waits for the curated presets before showing catalog stations', async () => {
    await renderRow({ data: [], status: 'loading' });
    expect(
      screen.queryByRole('button', { name: 'Play YleX' }),
    ).not.toBeInTheDocument();
  });

  it('shows one card per station once a preset covers it', async () => {
    await renderRow({ data: [ylexPreset], status: 'ready' });
    expect(
      await screen.findAllByRole('button', { name: 'Play YleX' }),
    ).toHaveLength(1);
    expect(
      screen.getByRole('button', { name: 'Play Radio Helsinki' }),
    ).toBeInTheDocument();
  });
});
