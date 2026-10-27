import type {
  GoogleDrivePickedFile,
  GoogleDrivePickerConfig,
} from '../api/sources/google-drive';

const GAPI_SRC = 'https://apis.google.com/js/api.js';

/** The audio types the API's import accepts (tahti-org `isAllowedDriveAudioMime`). */
const AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/vnd.wave',
  'audio/flac',
  'audio/x-flac',
  'audio/mp4',
  'audio/aac',
  'audio/ogg',
  'audio/webm',
].join(',');

type PickerDoc = { id: string; name: string; mimeType?: string };

type PickerResponse = { action: string; docs?: PickerDoc[] };

type DocsView = {
  setMimeTypes: (types: string) => DocsView;
  setIncludeFolders: (include: boolean) => DocsView;
};

type PickerBuilder = {
  addView: (view: DocsView) => PickerBuilder;
  enableFeature: (feature: string) => PickerBuilder;
  setOAuthToken: (token: string) => PickerBuilder;
  setDeveloperKey: (key: string) => PickerBuilder;
  setAppId: (appId: string) => PickerBuilder;
  setCallback: (callback: (response: PickerResponse) => void) => PickerBuilder;
  build: () => { setVisible: (visible: boolean) => void };
};

export type GooglePickerApi = {
  Action: { PICKED: string; CANCEL: string };
  Feature: { MULTISELECT_ENABLED: string };
  ViewId: { DOCS: string };
  DocsView: new (viewId: string) => DocsView;
  PickerBuilder: new () => PickerBuilder;
};

type GoogleWindow = Window & {
  gapi?: { load: (api: string, callback: () => void) => void };
  google?: { picker?: GooglePickerApi };
};

let loading: Promise<GooglePickerApi> | null = null;

function loadGapiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as GoogleWindow).gapi) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = GAPI_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not reach Google Drive.'));
    document.head.appendChild(script);
  });
}

/** Loads Google's Picker on first use; a failed load can be tried again. */
export function loadGooglePicker(): Promise<GooglePickerApi> {
  loading ??= loadGapiScript()
    .then(
      () =>
        new Promise<GooglePickerApi>((resolve, reject) => {
          const google = window as GoogleWindow;
          if (!google.gapi) {
            reject(new Error('Could not reach Google Drive.'));
            return;
          }
          google.gapi.load('picker', () => {
            const picker = google.google?.picker;
            if (picker) {
              resolve(picker);
            } else {
              reject(new Error('Google Drive picker did not load.'));
            }
          });
        }),
    )
    .catch((err: unknown) => {
      loading = null;
      throw err;
    });
  return loading;
}

/** The OAuth client id's leading number is the Cloud project number, which
 * the Picker needs as the app id to grant `drive.file` access to picked files. */
function appIdFromClientId(clientId: string): string | null {
  const match = /^(\d+)-/.exec(clientId);
  return match ? match[1]! : null;
}

/** Opens the Picker on the artist's audio files. Resolves with the picked
 * files, or an empty list when they close it. */
export function pickGoogleDriveFiles(
  picker: GooglePickerApi,
  config: GoogleDrivePickerConfig,
): Promise<GoogleDrivePickedFile[]> {
  return new Promise((resolve) => {
    const view = new picker.DocsView(picker.ViewId.DOCS)
      .setIncludeFolders(false)
      .setMimeTypes(AUDIO_MIME_TYPES);
    let builder = new picker.PickerBuilder()
      .addView(view)
      .enableFeature(picker.Feature.MULTISELECT_ENABLED)
      .setOAuthToken(config.accessToken)
      .setDeveloperKey(config.developerKey)
      .setCallback((response) => {
        if (response.action === picker.Action.PICKED) {
          resolve(
            (response.docs ?? []).map((doc) => ({
              fileId: doc.id,
              name: doc.name,
              ...(doc.mimeType ? { mimeType: doc.mimeType } : {}),
            })),
          );
        } else if (response.action === picker.Action.CANCEL) {
          resolve([]);
        }
      });
    const appId = appIdFromClientId(config.clientId);
    if (appId) {
      builder = builder.setAppId(appId);
    }
    builder.build().setVisible(true);
  });
}
