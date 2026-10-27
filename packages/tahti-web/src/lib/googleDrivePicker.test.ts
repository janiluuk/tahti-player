import { describe, expect, it, vi } from 'vitest';

import {
  pickGoogleDriveFiles,
  type GooglePickerApi,
} from './googleDrivePicker';

function fakePicker() {
  const calls = {
    appId: vi.fn(),
    callback: null as null | ((response: unknown) => void),
    visible: vi.fn(),
    mimeTypes: '',
  };
  class DocsView {
    setIncludeFolders() {
      return this;
    }
    setMimeTypes(types: string) {
      calls.mimeTypes = types;
      return this;
    }
  }
  class PickerBuilder {
    addView() {
      return this;
    }
    enableFeature() {
      return this;
    }
    setOAuthToken() {
      return this;
    }
    setDeveloperKey() {
      return this;
    }
    setAppId(appId: string) {
      calls.appId(appId);
      return this;
    }
    setCallback(callback: (response: unknown) => void) {
      calls.callback = callback;
      return this;
    }
    build() {
      return { setVisible: calls.visible };
    }
  }
  const api = {
    Action: { PICKED: 'picked', CANCEL: 'cancel' },
    Feature: { MULTISELECT_ENABLED: 'multi' },
    ViewId: { DOCS: 'docs' },
    DocsView,
    PickerBuilder,
  } as unknown as GooglePickerApi;
  return { api, calls };
}

const CONFIG = {
  clientId: '987654321-abc.apps.googleusercontent.com',
  developerKey: 'key',
  accessToken: 'token',
};

describe('pickGoogleDriveFiles', () => {
  it('opens on audio files with the project number as app id and returns the picks', async () => {
    const { api, calls } = fakePicker();

    const picked = pickGoogleDriveFiles(api, CONFIG);
    calls.callback!({ action: 'loaded' });
    calls.callback!({
      action: 'picked',
      docs: [
        { id: 'f1', name: 'one.wav', mimeType: 'audio/wav' },
        { id: 'f2', name: 'two.mp3' },
      ],
    });

    await expect(picked).resolves.toEqual([
      { fileId: 'f1', name: 'one.wav', mimeType: 'audio/wav' },
      { fileId: 'f2', name: 'two.mp3' },
    ]);
    expect(calls.visible).toHaveBeenCalledWith(true);
    expect(calls.appId).toHaveBeenCalledWith('987654321');
    expect(calls.mimeTypes).toContain('audio/mpeg');
  });

  it('resolves empty when the picker is closed', async () => {
    const { api, calls } = fakePicker();

    const picked = pickGoogleDriveFiles(api, CONFIG);
    calls.callback!({ action: 'cancel' });

    await expect(picked).resolves.toEqual([]);
  });
});
