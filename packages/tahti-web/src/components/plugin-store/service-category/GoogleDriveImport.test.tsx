// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { GoogleDriveSourceAdapter } from '../../../plugins/import-sources/types';
import { renderWithRouter } from '../../../test/renderWithRouter';
import { GoogleDriveImport } from './GoogleDriveImport';

const { toast, picker } = vi.hoisted(() => ({
  toast: { error: vi.fn(), success: vi.fn() },
  picker: { load: vi.fn(), pick: vi.fn() },
}));

vi.mock('sonner', () => ({ toast, Toaster: () => null }));
vi.mock('../../../lib/googleDrivePicker', () => ({
  loadGooglePicker: picker.load,
  pickGoogleDriveFiles: picker.pick,
}));

const CONFIG = {
  clientId: '1234-abc.apps.googleusercontent.com',
  developerKey: 'key',
  accessToken: 'token',
};

const adapter = {
  id: 'google-drive',
  pickerConfig: vi.fn(),
  importFiles: vi.fn(),
} as unknown as GoogleDriveSourceAdapter & {
  pickerConfig: ReturnType<typeof vi.fn>;
  importFiles: ReturnType<typeof vi.fn>;
};

const onConnectionLost = vi.fn();

const DriveImport = {
  async mount() {
    await renderWithRouter(
      <GoogleDriveImport
        adapter={adapter}
        onConnectionLost={onConnectionLost}
      />,
    );
  },
  chooseButton: {
    get element() {
      return screen.getByRole('button', { name: 'Choose files from Drive' });
    },
    async click() {
      fireEvent.click(this.element);
    },
  },
  async status() {
    return (await screen.findByRole('status')).textContent;
  },
};

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  picker.load.mockResolvedValue({});
});

describe('GoogleDriveImport', () => {
  it('queues the files picked in Google Drive', async () => {
    adapter.pickerConfig.mockResolvedValue({ ok: true, data: CONFIG });
    const files = [
      { fileId: 'f1', name: 'one.wav', mimeType: 'audio/wav' },
      { fileId: 'f2', name: 'two.mp3' },
    ];
    picker.pick.mockResolvedValue(files);
    adapter.importFiles.mockResolvedValue({ ok: true, count: 2 });
    await DriveImport.mount();

    await DriveImport.chooseButton.click();

    expect(await DriveImport.status()).toBe(
      'Queued import (2). Follow progress on Studio → Upload.',
    );
    expect(picker.pick).toHaveBeenCalledWith({}, CONFIG);
    expect(adapter.importFiles).toHaveBeenCalledWith(files);
    expect(toast.success).toHaveBeenCalled();
  });

  it('does nothing when the picker is closed without a choice', async () => {
    adapter.pickerConfig.mockResolvedValue({ ok: true, data: CONFIG });
    picker.pick.mockResolvedValue([]);
    await DriveImport.mount();

    await DriveImport.chooseButton.click();

    await waitFor(() =>
      expect(DriveImport.chooseButton.element).not.toBeDisabled(),
    );
    expect(adapter.importFiles).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('points to uploading when the server has no Picker set up', async () => {
    adapter.pickerConfig.mockResolvedValue({
      ok: false,
      reason: 'not-configured',
      error: 'Google Drive picking isn’t set up on this server yet.',
    });
    await DriveImport.mount();

    await DriveImport.chooseButton.click();

    expect(await DriveImport.status()).toMatch(/isn’t set up/);
    expect(DriveImport.chooseButton.element).toBeDisabled();
    expect(
      screen.getByRole('link', { name: 'Upload files' }).getAttribute('href'),
    ).toBe('/library/upload');
    expect(picker.load).not.toHaveBeenCalled();
  });

  it('re-reads the connection when the Drive link has expired', async () => {
    adapter.pickerConfig.mockResolvedValue({
      ok: false,
      reason: 'not-connected',
      error: 'Your Google Drive connection expired. Connect again.',
    });
    await DriveImport.mount();

    await DriveImport.chooseButton.click();

    await waitFor(() => expect(onConnectionLost).toHaveBeenCalledTimes(1));
    expect(toast.error).toHaveBeenCalledWith(
      'Your Google Drive connection expired. Connect again.',
    );
  });

  it('says so when Google’s picker cannot load', async () => {
    adapter.pickerConfig.mockResolvedValue({ ok: true, data: CONFIG });
    picker.load.mockRejectedValue(new Error('Could not reach Google Drive.'));
    await DriveImport.mount();

    await DriveImport.chooseButton.click();

    expect(await DriveImport.status()).toBe('Could not reach Google Drive.');
    expect(DriveImport.chooseButton.element).not.toBeDisabled();
  });
});
