// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../api/fallback-collection';
import { RotationSourcePicker } from './RotationSourcePicker';

const OPTIONS: api.FallbackCollectionOption[] = [
  {
    id: 'c1',
    slug: 'late-night',
    name: 'Late night',
    trackCount: 14,
    active: false,
  },
  { id: 'c2', slug: 'sunday', name: 'Sunday mix', trackCount: 1, active: true },
];

async function renderPicker(options: api.FallbackCollectionOption[] | null) {
  vi.spyOn(api, 'fetchFallbackCollections').mockResolvedValue({
    data: options,
    meta: { source: 'api' },
  });
  return act(async () => render(<RotationSourcePicker slug="night-drive" />));
}

async function pick(button: HTMLElement, name: string) {
  await act(async () => {
    fireEvent.click(button);
  });
  const option = await screen.findByRole('option', { name });
  await act(async () => {
    fireEvent.click(option);
  });
}

describe('RotationSourcePicker', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the active collection and switches back to the default', async () => {
    await renderPicker(OPTIONS);
    const save = vi
      .spyOn(api, 'setFallbackCollection')
      .mockResolvedValue({ ok: true });
    const button = screen.getByRole('button', { name: /Play from/ });
    expect(button.textContent).toContain('Sunday mix (1 track)');
    await pick(button, 'Tracks marked for rotation');
    expect(save).toHaveBeenCalledWith('night-drive', null);
  });

  it('puts the choice back when saving fails', async () => {
    await renderPicker(OPTIONS);
    vi.spyOn(api, 'setFallbackCollection').mockResolvedValue({
      ok: false,
      error: 'Collection not found',
    });
    const button = screen.getByRole('button', { name: /Play from/ });
    await pick(button, 'Late night (14 tracks)');
    expect(button.textContent).toContain('Sunday mix');
  });

  it('renders nothing without collections or on failure', async () => {
    const { container } = await renderPicker([]);
    expect(container.textContent).toBe('');
    cleanup();
    const failed = await renderPicker(null);
    expect(failed.container.textContent).toBe('');
  });
});
