/**
 * Shared page setup for the screenshot capture scripts (forced mock mode,
 * VITE_FORCE_MOCK=1):
 * - the Spotify theme in the mode picked by CAPTURE_THEME_MODE
 *   (`dark`, the default, or `light`); light captures get a `--light` suffix;
 * - no unread notifications or messages and no toasts, so captures never
 *   show inbox badges or pop-ups (the mock fixtures read these keys);
 * - a fixed listening history for the mock users, so History and
 *   "Recently played" show content instead of their empty states.
 */
export const CAPTURE_THEME_MODE =
  process.env.CAPTURE_THEME_MODE === 'light' ? 'light' : 'dark';

const CAPTURE_THEME_ID = 'custom:spotify-dark-theme';

/** `tahti-web-theme` persisted store state for the capture theme. */
export const CAPTURE_THEME_STATE = {
  state: {
    themeId: CAPTURE_THEME_ID,
    dark: CAPTURE_THEME_MODE === 'dark',
    colorMode: CAPTURE_THEME_MODE,
    customThemes: {},
  },
  version: 0,
};

/** `listen-home.png` -> `listen-home--light.png` in light mode. */
export function withThemeSuffix(fileName) {
  return CAPTURE_THEME_MODE === 'light'
    ? fileName.replace(/\.png$/, '--light.png')
    : fileName;
}

const QUIET_STORAGE = {
  'tahti-web-mock-notifications-dismissed': [
    'notification-mock-1',
    'notification-mock-2',
  ],
  'tahti-web-mock-messages-read': ['conv-mock-1'],
};

const QUIET_CSS = '[data-sonner-toaster] { display: none !important; }';

/** User ids the capture scripts sign in as. */
const MOCK_USER_IDS = ['mock-1', 'mock-board-1'];

const DEMO_TRACKS = [
  ['Midnight Broadcast', 'Northern Lights', 372],
  ['Polar Static', 'Northern Lights', 244],
  ['Night Bus Atlas', 'Midnight Cartography', 318],
  ['Ring Rail', 'Midnight Cartography', 205],
  ['Signal Decay', 'Aurora Drift', 281],
  ['Ice-Out', 'Aurora Drift', 233],
  ['Loop Diary', 'Mart Saar', 196],
  ['Chrome Highway', 'Liis Kask', 262],
  ['Moonlight Drive', 'DJ Moonlight', 345],
  ['After Hours', 'DJ Moonlight', 301],
];

/** Plays spread over the last four weeks, weighted towards evenings. */
function demoHistory(now) {
  const hours = [21, 22, 20, 23, 19, 18, 21, 22, 13, 9];
  const entries = [];
  for (let index = 0; index < 48; index += 1) {
    const [title, artist, durationSec] =
      DEMO_TRACKS[(index * 7) % DEMO_TRACKS.length];
    const played = new Date(now);
    played.setDate(played.getDate() - Math.floor(index * 0.6));
    played.setHours(hours[index % hours.length], (index * 13) % 60, 0, 0);
    entries.push({
      playable: {
        id: `sound:demo-history-${index % DEMO_TRACKS.length}`,
        kind: 'sound',
        title,
        artist,
        streamUrl: '',
        protocol: 'https',
        durationSec,
      },
      playedAt: played.toISOString(),
    });
  }
  return entries.sort((a, b) => b.playedAt.localeCompare(a.playedAt));
}

/** Registers the capture state on a page; call right after `newPage()`. */
export async function prepareCapturePage(page) {
  await page.addInitScript(
    ({ storage, css, userIds, history, theme }) => {
      for (const [key, value] of Object.entries(storage)) {
        localStorage.setItem(key, JSON.stringify(value));
      }
      for (const userId of userIds) {
        localStorage.setItem(
          `tahti-web:library:${userId}`,
          JSON.stringify({ state: { history, scopeKey: userId }, version: 2 }),
        );
      }
      localStorage.setItem('tahti-web-theme', JSON.stringify(theme));
      // Legacy keys the theme store's early index.html bootstrap reads
      // before zustand rehydrates -- see plugins/themes/store.ts.
      localStorage.setItem('tahti-nuclear-theme-id', theme.state.themeId);
      localStorage.setItem('tahti-nuclear-dark', theme.state.dark ? '1' : '0');
      const addStyle = () => {
        const style = document.createElement('style');
        style.dataset.captureSetup = '';
        style.textContent = css;
        document.head.append(style);
      };
      if (document.head) {
        addStyle();
      } else {
        document.addEventListener('DOMContentLoaded', addStyle, { once: true });
      }
    },
    {
      storage: QUIET_STORAGE,
      css: QUIET_CSS,
      userIds: MOCK_USER_IDS,
      history: demoHistory(Date.now()),
      theme: CAPTURE_THEME_STATE,
    },
  );
}
