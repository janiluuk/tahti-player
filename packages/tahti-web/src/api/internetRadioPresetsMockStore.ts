export type MockInternetRadioPreset = {
  id: string;
  name: string;
  genre: string | null;
  description: string | null;
  iconUrl: string | null;
  programmingUrl: string | null;
  streamUrl: string | null;
  enabled: boolean;
};

const STORAGE_KEY = 'tahti-web-internet-radio-presets';

const INITIAL_PRESETS: MockInternetRadioPreset[] = [
  {
    id: 'preset-ylex',
    name: 'YleX',
    genre: 'Pop / Hits',
    description: 'Finnish youth-focused pop and hits station.',
    iconUrl: '/radio-logos/ylex.png',
    programmingUrl: 'https://areena.yle.fi/audio/ohjelmat/yle-x',
    streamUrl: 'https://icecast.live.yle.fi/radio/YleX/icecast.audio',
    enabled: true,
  },
  {
    id: 'preset-radio-helsinki',
    name: 'Radio Helsinki',
    genre: 'Talk / Variety',
    description: 'Helsinki-area talk and variety station.',
    iconUrl: '/radio-logos/radio-helsinki.png',
    programmingUrl: 'https://www.radiohelsinki.fi/ohjelmakartta/',
    streamUrl: 'https://stream.radiohelsinki.fi/stream',
    enabled: true,
  },
  {
    id: 'preset-radio-rock',
    name: 'Radio Rock',
    genre: 'Rock',
    description: 'Finnish rock radio station.',
    iconUrl: '/radio-logos/radio-rock.jpg',
    programmingUrl: 'https://www.radiorock.fi/',
    streamUrl:
      'https://aud-stream-radiorock.nm-elemental.nelonenmedia.fi/playlist.m3u8',
    enabled: true,
  },
  {
    id: 'preset-suomipop',
    name: 'Suomipop',
    genre: 'Pop',
    description: 'Finnish contemporary pop station.',
    iconUrl: '/radio-logos/suomipop.jpg',
    programmingUrl: 'https://www.supla.fi/suomipop',
    streamUrl:
      'https://aud-stream-suomipop.nm-elemental.nelonenmedia.fi/playlist.m3u8',
    enabled: true,
  },
  {
    id: 'preset-nrj',
    name: 'NRJ',
    genre: 'Pop / Hits',
    description: 'Hit music radio for Finland.',
    iconUrl: '/radio-logos/nrj.jpg',
    programmingUrl: 'https://www.radioplay.fi/nrj',
    streamUrl:
      'https://stream-redirect.bauermedia.fi/nrj/nrj_64.aac?aw_0_1st.bauer_loggedin=false&aw_0_1st.playerid=BMUK_tunein',
    enabled: true,
  },
  {
    id: 'preset-radio-nova',
    name: 'Radio Nova',
    genre: 'Pop',
    description: 'Mainstream Finnish pop radio.',
    iconUrl: '/radio-logos/radio-nova.jpg',
    programmingUrl: 'https://www.radioplay.fi/radio-nova',
    streamUrl:
      'https://stream-redirect.bauermedia.fi/radionova/radionova_64.aac?aw_0_1st.bauer_loggedin=false&aw_0_1st.playerid=BMUK_tunein',
    enabled: true,
  },
];

function cloneInitialPresets(): MockInternetRadioPreset[] {
  return INITIAL_PRESETS.map((preset) => ({ ...preset }));
}

function readStoredPresets(): MockInternetRadioPreset[] | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return null;
    }
    return parsed.filter((item): item is MockInternetRadioPreset => {
      return (
        Boolean(item) &&
        typeof item === 'object' &&
        typeof (item as MockInternetRadioPreset).id === 'string' &&
        typeof (item as MockInternetRadioPreset).name === 'string'
      );
    });
  } catch {
    return null;
  }
}

function persistPresets(): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

let presets: MockInternetRadioPreset[] =
  readStoredPresets() ?? cloneInitialPresets();

export function listMockInternetRadioPresets(): MockInternetRadioPreset[] {
  return presets;
}

export function resetMockInternetRadioPresets(): void {
  presets = cloneInitialPresets();
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function listEnabledMockInternetRadioPresets(): MockInternetRadioPreset[] {
  return presets.filter((p) => p.enabled);
}

export function createMockInternetRadioPreset(
  input: Omit<MockInternetRadioPreset, 'id' | 'enabled'> & {
    enabled?: boolean;
  },
): MockInternetRadioPreset {
  const preset: MockInternetRadioPreset = {
    id: `preset-${Date.now()}`,
    enabled: false,
    ...input,
  };
  presets = [preset, ...presets];
  persistPresets();
  return preset;
}

export function patchMockInternetRadioPreset(
  id: string,
  patch: Partial<Omit<MockInternetRadioPreset, 'id'>>,
): MockInternetRadioPreset | null {
  const existing = presets.find((p) => p.id === id);
  if (!existing) {
    return null;
  }
  const updated = { ...existing, ...patch };
  presets = presets.map((p) => (p.id === id ? updated : p));
  persistPresets();
  return updated;
}

export function deleteMockInternetRadioPreset(id: string): void {
  presets = presets.filter((p) => p.id !== id);
  persistPresets();
}
