import { act, fireEvent, render, screen } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../api/sources/mixcloud';
import { MixcloudImportPanel } from './MixcloudImportPanel';

const cloudcast = {
  url: 'https://www.mixcloud.com/selector/sunday/',
  title: 'Sunday Selector',
  username: 'selector',
  displayName: 'Selector',
  durationSec: 5400,
  coverUrl: null,
  genre: null,
};

describe('MixcloudImportPanel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('searches Mixcloud and adds a cloudcast to the collection', async () => {
    const search = vi
      .spyOn(api, 'searchMixcloud')
      .mockResolvedValue({ ok: true, data: [cloudcast] });
    const add = vi
      .spyOn(api, 'addMixcloudCloudcast')
      .mockResolvedValue({ ok: true, data: { soundId: 's1' } });
    const onAdded = vi.fn();
    vi.spyOn(toast, 'success');

    render(<MixcloudImportPanel collectionId="col-1" onAdded={onAdded} />);
    fireEvent.change(screen.getByLabelText('Search Mixcloud'), {
      target: { value: 'sunday' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Find' }));
    });
    expect(search).toHaveBeenCalledWith('sunday');
    expect(screen.getByText('Selector · 1 h 30 min')).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    });
    expect(add).toHaveBeenCalledWith('col-1', cloudcast.url);
    expect(onAdded).toHaveBeenCalled();
    expect(
      (screen.getByRole('button', { name: 'Added' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it('loads your own mixes and explains an empty handle', async () => {
    vi.spyOn(api, 'fetchMyMixcloudCloudcasts').mockResolvedValue({
      ok: true,
      data: [],
    });
    render(<MixcloudImportPanel collectionId="col-1" onAdded={vi.fn()} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('radio', { name: 'Your mixes' }));
    });
    expect(
      screen.getByText(
        'No mixes found. Add your Mixcloud handle to your social links first.',
      ),
    ).toBeTruthy();
  });
});
