import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';

import { VoiceRecorder } from './VoiceRecorder';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('explains microphone permission errors and allows another attempt', async () => {
  const getUserMedia = vi
    .fn()
    .mockRejectedValue(
      new DOMException('Microphone permission denied', 'NotAllowedError'),
    );
  vi.stubGlobal('AudioWorkletNode', class {});
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
  render(<VoiceRecorder onUse={vi.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: 'Record voice' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Microphone permission denied',
  );
  expect(screen.getByRole('button', { name: 'Record voice' })).toBeEnabled();
});

it('releases a microphone that opens after the user leaves', async () => {
  let resolveStream!: (stream: MediaStream) => void;
  const getUserMedia = vi.fn(
    () =>
      new Promise<MediaStream>((resolve) => {
        resolveStream = resolve;
      }),
  );
  const stop = vi.fn();
  vi.stubGlobal('AudioWorkletNode', class {});
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
  const view = render(<VoiceRecorder onUse={vi.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: 'Record voice' }));
  view.unmount();
  resolveStream({ getTracks: () => [{ stop }] } as unknown as MediaStream);
  await waitFor(() => expect(stop).toHaveBeenCalledOnce());
});
