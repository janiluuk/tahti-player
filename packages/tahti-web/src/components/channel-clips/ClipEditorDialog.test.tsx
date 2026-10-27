import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import * as api from '../../api/clip-editor';
import { ClipEditorDialog } from './ClipEditorDialog';

vi.mock('../tahti/WaveformSeekbar', () => ({ WaveformSeekbar: () => null }));
beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(
    () => undefined,
  );
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const settings = {
  ...api.ORIGINAL_VOICE,
  startSec: 0,
  endSec: 8,
  fadeInSec: 0,
  fadeOutSec: 0,
};
const source: api.ClipEditorSource = {
  url: '/clip.wav',
  originalUrl: '/original.wav',
  title: 'Station ID',
  durationSec: 8,
  renderStatus: 'READY',
  editorSettings: null,
  draftSettings: settings,
  draftUrl: '/preview.wav',
  draftStatus: 'READY',
  renderToken: 'render-1',
};

it('saves only the previewed version and invalidates it when audio settings change', async () => {
  vi.spyOn(api, 'fetchClipEditorSource').mockResolvedValue(source);
  const apply = vi.spyOn(api, 'applyClipEdit').mockResolvedValue();
  render(
    <ClipEditorDialog
      clip={{
        id: 'clip-1',
        title: 'Station ID',
        durationSec: 8,
        isEnabled: false,
        renderStatus: 'READY',
        contentType: 'CLIP',
      }}
      programs={[]}
      onClose={vi.fn()}
      onSaved={vi.fn()}
    />,
  );
  const activate = await screen.findByRole('button', {
    name: 'Save & activate',
  });
  await waitFor(() => expect(activate).toBeEnabled());
  await userEvent.click(activate);
  expect(apply).toHaveBeenCalledWith(
    'clip-1',
    expect.objectContaining({ renderToken: 'render-1', isEnabled: true }),
  );
});

it('requires a new preview after changing voice effects', async () => {
  vi.spyOn(api, 'fetchClipEditorSource').mockResolvedValue(source);
  render(
    <ClipEditorDialog
      clip={{
        id: 'clip-1',
        title: 'Station ID',
        durationSec: 8,
        isEnabled: true,
        renderStatus: 'READY',
        contentType: 'CLIP',
      }}
      programs={[]}
      onClose={vi.fn()}
      onSaved={vi.fn()}
    />,
  );
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Save & activate' }),
    ).toBeEnabled(),
  );
  await userEvent.click(screen.getByRole('button', { name: 'Natural voice' }));
  expect(
    screen.getByRole('button', { name: 'Save & activate' }),
  ).toBeDisabled();
  expect(
    screen.getByText('Generate a preview to hear and save these changes.'),
  ).toBeVisible();
});

it('shows a recoverable source error', async () => {
  vi.spyOn(api, 'fetchClipEditorSource').mockRejectedValue(
    new Error('Audio unavailable'),
  );
  render(
    <ClipEditorDialog
      clip={{
        id: 'clip-1',
        title: 'Station ID',
        durationSec: 8,
        isEnabled: false,
        renderStatus: 'READY',
        contentType: 'CLIP',
      }}
      programs={[]}
      onClose={vi.fn()}
      onSaved={vi.fn()}
    />,
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Audio unavailable',
  );
  expect(screen.getByRole('button', { name: 'Retry' })).toBeVisible();
});
