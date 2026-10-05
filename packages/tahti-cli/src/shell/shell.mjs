import blessed from 'blessed';

import { CliError, requireToken } from '../api-client.mjs';
import {
  listLabel,
  loadLibraryItems,
  loadRadioItems,
  loadSearchItems,
  resolveLibraryPlayUrl,
} from './api.mjs';
import { HELP_TEXT, resolveKeyAction } from './keys.mjs';
import { MpvController } from './mpv.mjs';
import {
  addToQueue,
  advanceQueue,
  clampListIndex,
  clearQueue,
  createInitialState,
  currentList,
  currentNavId,
  moveList,
  moveNav,
  NAV_ITEMS,
  nowPlayingLine,
  selectedItem,
  setFocus,
  setNowPlaying,
  toggleFocus,
} from './state.mjs';

function assertTty() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new CliError(
      '`tahti shell` needs an interactive terminal (TTY). Pipe/redirect is not supported.',
    );
  }
}

export async function runShell(config) {
  assertTty();
  requireToken(config);

  let state = createInitialState();
  let searchInput = null;
  let pollTimer = null;
  let closed = false;
  let exitCode = 0;
  let resolveDone;

  const screen = blessed.screen({
    smartCSR: true,
    title: 'tahti shell',
    fullUnicode: true,
  });

  const navBox = blessed.list({
    parent: screen,
    label: ' Nav ',
    left: 0,
    top: 0,
    width: 18,
    height: '100%-3',
    keys: false,
    mouse: true,
    tags: true,
    border: { type: 'line' },
    style: {
      selected: { bg: 'cyan', fg: 'black' },
      border: { fg: 'gray' },
    },
    items: NAV_ITEMS.map((item) => item.label),
  });

  const listBox = blessed.list({
    parent: screen,
    label: ' Library ',
    left: 18,
    top: 0,
    width: '100%-18',
    height: '100%-3',
    keys: false,
    mouse: true,
    tags: true,
    border: { type: 'line' },
    style: {
      selected: { bg: 'cyan', fg: 'black' },
      border: { fg: 'cyan' },
    },
    items: ['Loading…'],
  });

  const statusBox = blessed.box({
    parent: screen,
    bottom: 0,
    left: 0,
    height: 3,
    width: '100%',
    border: { type: 'line' },
    tags: true,
    content: '',
  });

  const helpBox = blessed.box({
    parent: screen,
    hidden: true,
    top: 'center',
    left: 'center',
    width: '80%',
    height: '80%',
    border: { type: 'line' },
    label: ' Help ',
    tags: true,
    content: HELP_TEXT,
    scrollable: true,
  });

  const mpv = new MpvController({
    onEnd: () => {
      void handleTrackEnd();
    },
  });

  function setState(next) {
    state = clampListIndex(next);
    render();
  }

  function render() {
    const navId = currentNavId(state);
    navBox.select(state.navIndex);
    navBox.style.border.fg = state.focus === 'nav' ? 'cyan' : 'gray';

    const labels = {
      library: ' Library ',
      search: state.searchQuery ? ` Search: ${state.searchQuery} ` : ' Search ',
      radio: ' Radio ',
      queue: ' Queue ',
    };
    listBox.setLabel(labels[navId] ?? ' List ');
    listBox.style.border.fg = state.focus === 'list' ? 'cyan' : 'gray';

    const items = currentList(state);
    if (state.loading) {
      listBox.setItems(['Loading…']);
    } else if (items.length === 0) {
      const empty = {
        library: 'No library items.',
        search: state.searchQuery ? 'No tracks found.' : 'Press / to search.',
        radio: 'No radio stations.',
        queue: 'Queue is empty.',
      };
      listBox.setItems([empty[navId] ?? 'Empty.']);
    } else {
      listBox.setItems(items.map(listLabel));
      listBox.select(state.listIndex);
    }

    const statusLine = state.status
      ? `${nowPlayingLine(state)}\n${state.status}`
      : nowPlayingLine(state);
    statusBox.setContent(statusLine);

    if (state.helpVisible) {
      helpBox.show();
      helpBox.setFront();
    } else {
      helpBox.hide();
    }

    screen.render();
  }

  async function refreshLibrary() {
    setState({ ...state, loading: true, status: 'Loading library…' });
    try {
      const library = await loadLibraryItems(config);
      setState({
        ...state,
        library,
        loading: false,
        status: `Loaded ${library.length} library items.`,
      });
    } catch (error) {
      setState({
        ...state,
        loading: false,
        status: error?.message ?? String(error),
      });
    }
  }

  async function refreshRadio() {
    setState({ ...state, loading: true, status: 'Loading radio…' });
    try {
      const radioItems = await loadRadioItems(config);
      setState({
        ...state,
        radioItems,
        loading: false,
        status: `Loaded ${radioItems.length} radio sources.`,
      });
    } catch (error) {
      setState({
        ...state,
        loading: false,
        status: error?.message ?? String(error),
      });
    }
  }

  async function runSearch(query) {
    const trimmed = query?.trim() ?? '';
    if (!trimmed) {
      setState({
        ...state,
        status: 'Enter a search query.',
        focus: 'list',
      });
      return;
    }
    setState({
      ...state,
      searchQuery: trimmed,
      loading: true,
      focus: 'list',
      status: `Searching “${trimmed}”…`,
    });
    try {
      const searchResults = await loadSearchItems(config, trimmed);
      setState({
        ...state,
        searchResults,
        listIndex: 0,
        loading: false,
        status: `${searchResults.length} result(s).`,
      });
    } catch (error) {
      setState({
        ...state,
        loading: false,
        status: error?.message ?? String(error),
      });
    }
  }

  async function playItem(item, { enqueueRest = false } = {}) {
    if (!item) {
      return;
    }

    let url = item.url ?? null;
    if (item.source === 'library') {
      try {
        url = await resolveLibraryPlayUrl(config, item.id);
      } catch (error) {
        setState({
          ...state,
          status: error?.message ?? String(error),
        });
        return;
      }
    } else if (item.source === 'search' && !url) {
      setState({
        ...state,
        status:
          'Search results have no stream URL — open the track on tahti.live, or play from Library.',
      });
      return;
    } else if (item.source === 'radio' && !url) {
      setState({
        ...state,
        status: 'No stream URL for this station.',
      });
      return;
    }

    const playable = { ...item, url };
    const isLive = playable.kind === 'live';

    try {
      if (!mpv.running) {
        await mpv.start();
      }
      await mpv.load(url);
      let next = setNowPlaying(state, playable, {
        clearQueueForLive: isLive,
      });
      if (enqueueRest && playable.source === 'library') {
        const rest = state.library.slice(state.listIndex + 1);
        if (rest.length > 0) {
          next = {
            ...next,
            queue: [...next.queue, ...rest],
            status: `Playing: ${playable.title} (+${rest.length} queued)`,
          };
        }
      }
      setState(next);
    } catch (error) {
      setState({
        ...state,
        status: error?.message ?? String(error),
      });
    }
  }

  async function handleTrackEnd() {
    if (state.nowPlaying?.kind === 'live') {
      return;
    }
    const next = advanceQueue(state);
    setState(next);
    if (next.nowPlaying?.url) {
      try {
        await mpv.load(next.nowPlaying.url);
      } catch (error) {
        setState({
          ...state,
          status: error?.message ?? String(error),
        });
      }
    } else if (next.nowPlaying?.source === 'library') {
      await playItem(next.nowPlaying);
    }
  }

  async function pollPlayback() {
    if (!mpv.running || !state.nowPlaying) {
      return;
    }
    try {
      const [paused, timePos, duration] = await Promise.all([
        mpv.getPaused(),
        mpv.getTimePos(),
        mpv.getDuration(),
      ]);
      setState({
        ...state,
        paused: Boolean(paused),
        timePos: typeof timePos === 'number' ? timePos : state.timePos,
        duration: typeof duration === 'number' ? duration : state.duration,
      });
    } catch {
      // ignore transient IPC errors
    }
  }

  function openSearchPrompt() {
    if (currentNavId(state) !== 'search') {
      const searchIndex = NAV_ITEMS.findIndex((item) => item.id === 'search');
      setState({
        ...state,
        navIndex: searchIndex,
        listIndex: 0,
        focus: 'list',
      });
    }
    if (searchInput) {
      searchInput.detach();
      searchInput = null;
    }
    searchInput = blessed.textbox({
      parent: screen,
      bottom: 3,
      left: 18,
      height: 3,
      width: '100%-18',
      border: { type: 'line' },
      label: ' Query ',
      inputOnFocus: true,
    });
    setState({ ...state, focus: 'search' });
    searchInput.focus();
    searchInput.readInput();
    searchInput.once('submit', (value) => {
      searchInput.detach();
      searchInput = null;
      void runSearch(value);
    });
    searchInput.once('cancel', () => {
      searchInput.detach();
      searchInput = null;
      setState({ ...state, focus: 'list', status: 'Search cancelled.' });
    });
  }

  async function dispatch(action) {
    if (!action) {
      return;
    }
    switch (action) {
      case 'quit':
        await shutdown(0);
        return;
      case 'toggleFocus':
        setState(toggleFocus(state));
        return;
      case 'focusNav':
        setState(setFocus(state, 'nav'));
        return;
      case 'navUp':
        setState(moveNav(state, -1));
        void maybeAutoload();
        return;
      case 'navDown':
        setState(moveNav(state, 1));
        void maybeAutoload();
        return;
      case 'listUp':
        setState(moveList(state, -1));
        return;
      case 'listDown':
        setState(moveList(state, 1));
        return;
      case 'activate': {
        const item = selectedItem(state);
        if (currentNavId(state) === 'queue' && item) {
          await playItem(item);
          return;
        }
        await playItem(item, {
          enqueueRest: currentNavId(state) === 'library',
        });
        return;
      }
      case 'enqueue': {
        const item = selectedItem(state);
        setState(addToQueue(state, item));
        return;
      }
      case 'clearQueue':
        setState(clearQueue(state));
        return;
      case 'togglePause':
        try {
          if (!mpv.running || !state.nowPlaying) {
            const item = selectedItem(state);
            await playItem(item);
            return;
          }
          const paused = await mpv.togglePause();
          setState({
            ...state,
            paused,
            status: paused ? 'Paused.' : 'Playing.',
          });
        } catch (error) {
          setState({ ...state, status: error?.message ?? String(error) });
        }
        return;
      case 'next': {
        const next = advanceQueue(state);
        setState(next);
        if (next.nowPlaying) {
          await playItem(next.nowPlaying);
        } else if (mpv.running) {
          try {
            await mpv.pause();
          } catch {
            // ignore
          }
        }
        return;
      }
      case 'prev':
        setState({
          ...state,
          status: 'Previous track is not available in v1 (restart from list).',
        });
        return;
      case 'seekBack':
        try {
          if (mpv.running) {
            await mpv.seek(-5);
          }
        } catch (error) {
          setState({ ...state, status: error?.message ?? String(error) });
        }
        return;
      case 'seekForward':
        try {
          if (mpv.running) {
            await mpv.seek(5);
          }
        } catch (error) {
          setState({ ...state, status: error?.message ?? String(error) });
        }
        return;
      case 'searchFocus':
        openSearchPrompt();
        return;
      case 'helpToggle':
        setState({ ...state, helpVisible: !state.helpVisible });
        return;
      default:
        break;
    }
  }

  async function maybeAutoload() {
    const id = currentNavId(state);
    if (id === 'library' && state.library.length === 0 && !state.loading) {
      await refreshLibrary();
    }
    if (id === 'radio' && state.radioItems.length === 0 && !state.loading) {
      await refreshRadio();
    }
  }

  async function shutdown(code) {
    if (closed) {
      return;
    }
    closed = true;
    exitCode = code;
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    try {
      await mpv.stop();
    } catch {
      // ignore
    }
    screen.destroy();
    resolveDone?.();
  }

  screen.key(['C-c'], () => {
    void shutdown(0);
  });

  screen.on('keypress', (_ch, key) => {
    if (state.focus === 'search') {
      return;
    }
    const action = resolveKeyAction(key, {
      focus: state.focus,
      helpVisible: state.helpVisible,
    });
    void dispatch(action);
  });

  navBox.on('select', (_item, index) => {
    setState({ ...state, navIndex: index, listIndex: 0, focus: 'list' });
    void maybeAutoload();
  });

  listBox.on('select', (_item, index) => {
    setState({ ...state, listIndex: index, focus: 'list' });
    void dispatch('activate');
  });

  render();
  await refreshLibrary();
  pollTimer = setInterval(() => {
    void pollPlayback();
  }, 500);

  await new Promise((resolve) => {
    resolveDone = resolve;
  });
  return { output: '', exitCode };
}
