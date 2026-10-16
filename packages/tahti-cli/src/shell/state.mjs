export const NAV_ITEMS = [
  { id: 'library', label: 'Library' },
  { id: 'search', label: 'Search' },
  { id: 'likes', label: 'Likes' },
  { id: 'radio', label: 'Radio' },
  { id: 'queue', label: 'Queue' },
  { id: 'history', label: 'History' },
];

export const HISTORY_LIMIT = 100;
export const RESTART_AFTER_SECONDS = 3;

export function createInitialState() {
  return {
    navIndex: 0,
    focus: 'list', // 'nav' | 'list' | 'search'
    library: [],
    searchQuery: '',
    searchResults: [],
    likes: [],
    radioItems: [],
    queue: [],
    history: [],
    listIndex: 0,
    nowPlaying: null, // { id, title, artist, kind: 'track'|'live', url }
    paused: true,
    timePos: null,
    duration: null,
    status: '',
    helpVisible: false,
    loading: false,
  };
}

export function currentNavId(state) {
  return NAV_ITEMS[state.navIndex]?.id ?? 'library';
}

export function currentList(state) {
  switch (currentNavId(state)) {
    case 'library':
      return state.library;
    case 'search':
      return state.searchResults;
    case 'likes':
      return state.likes;
    case 'radio':
      return state.radioItems;
    case 'queue':
      return state.queue;
    case 'history':
      return state.history;
    default:
      return [];
  }
}

export function clampListIndex(state) {
  const list = currentList(state);
  if (list.length === 0) {
    return { ...state, listIndex: 0 };
  }
  const listIndex = Math.min(Math.max(state.listIndex, 0), list.length - 1);
  return listIndex === state.listIndex ? state : { ...state, listIndex };
}

export function moveNav(state, delta) {
  const next = Math.min(
    Math.max(state.navIndex + delta, 0),
    NAV_ITEMS.length - 1,
  );
  if (next === state.navIndex) {
    return state;
  }
  return clampListIndex({ ...state, navIndex: next, listIndex: 0 });
}

export function moveList(state, delta) {
  const list = currentList(state);
  if (list.length === 0) {
    return state;
  }
  const listIndex = Math.min(
    Math.max(state.listIndex + delta, 0),
    list.length - 1,
  );
  return listIndex === state.listIndex ? state : { ...state, listIndex };
}

export function setFocus(state, focus) {
  return state.focus === focus ? state : { ...state, focus };
}

export function toggleFocus(state) {
  if (state.focus === 'search') {
    return { ...state, focus: 'list' };
  }
  return { ...state, focus: state.focus === 'nav' ? 'list' : 'nav' };
}

export function selectedItem(state) {
  const list = currentList(state);
  return list[state.listIndex] ?? null;
}

export function addToQueue(state, item) {
  if (!item || item.kind === 'live') {
    return {
      ...state,
      status:
        item?.kind === 'live' ? 'Live streams are not queued.' : state.status,
    };
  }
  return {
    ...state,
    queue: [...state.queue, item],
    status: `Queued: ${item.title}`,
  };
}

export function clearQueue(state) {
  return { ...state, queue: [], status: 'Queue cleared.' };
}

function sameItem(a, b) {
  return Boolean(a && b && a.source === b.source && a.id === b.id);
}

/** Puts the track that was playing at the top of the history when another
 * one replaces it. Live streams stay out: they have no "previous" to go back
 * to, and the Radio list already holds them. */
export function rememberPlayed(state, replacement) {
  const played = state.nowPlaying;
  if (!played || played.kind === 'live' || sameItem(played, replacement)) {
    return state.history;
  }
  return [played, ...state.history].slice(0, HISTORY_LIMIT);
}

export function setNowPlaying(state, item, { clearQueueForLive = false } = {}) {
  const next = {
    ...state,
    history: rememberPlayed(state, item),
    nowPlaying: item,
    paused: false,
    timePos: 0,
    duration: item?.durationSec ?? null,
    status: item ? `Playing: ${item.title}` : state.status,
  };
  if (clearQueueForLive && item?.kind === 'live') {
    next.queue = [];
  }
  return next;
}

export function advanceQueue(state) {
  if (state.queue.length === 0) {
    return {
      ...state,
      history: rememberPlayed(state, null),
      nowPlaying: null,
      paused: true,
      timePos: null,
      duration: null,
      status: 'Queue finished.',
    };
  }
  const [next, ...rest] = state.queue;
  return {
    ...state,
    history: rememberPlayed(state, next),
    queue: rest,
    nowPlaying: next,
    paused: false,
    timePos: 0,
    duration: next.durationSec ?? null,
    status: `Playing: ${next.title}`,
  };
}

export function shouldRestart(state) {
  return Boolean(
    state.nowPlaying &&
    state.nowPlaying.kind !== 'live' &&
    state.timePos > RESTART_AFTER_SECONDS,
  );
}

/** Steps back to the last track in the history. The track that was playing
 * goes to the front of the queue, so `n` returns to it. */
export function goToPrevious(state) {
  const [previous, ...older] = state.history;
  if (!previous) {
    return { ...state, status: 'Nothing played before this.' };
  }
  const current = state.nowPlaying;
  const requeue = current && current.kind !== 'live' ? [current] : [];
  return {
    ...state,
    history: older,
    queue: [...requeue, ...state.queue],
    nowPlaying: previous,
    paused: false,
    timePos: 0,
    duration: previous.durationSec ?? null,
    status: `Playing: ${previous.title}`,
  };
}

export function formatTime(seconds) {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) {
    return '--:--';
  }
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function nowPlayingLine(state) {
  if (!state.nowPlaying) {
    return 'Stopped · Space play/pause · n/p next/prev · ? help · q quit';
  }
  const { title, artist, kind } = state.nowPlaying;
  const who = artist ? `${title} — ${artist}` : title;
  const stateLabel = state.paused ? 'Paused' : 'Playing';
  const live = kind === 'live' ? ' [LIVE]' : '';
  const time =
    kind === 'live'
      ? ''
      : ` · ${formatTime(state.timePos)} / ${formatTime(state.duration)}`;
  return `${stateLabel}${live}: ${who}${time}`;
}
