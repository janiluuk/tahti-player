/**
 * Resolve a blessed key event into a shell action name.
 * Returns null when the key is not bound (or should be ignored).
 */
export function resolveKeyAction(key, { focus, helpVisible } = {}) {
  const name = key?.full ?? key?.name ?? '';
  const ch = key?.ch ?? '';

  if (helpVisible) {
    if (name === 'escape' || name === 'q' || ch === '?' || name === '?') {
      return 'helpToggle';
    }
    return null;
  }

  if (focus === 'search') {
    if (name === 'escape') {
      return 'searchCancel';
    }
    if (name === 'enter' || name === 'return') {
      return 'searchSubmit';
    }
    return null;
  }

  switch (name) {
    case 'q':
      return 'quit';
    case 'C-c':
      return 'quit';
    case 'tab':
      return 'toggleFocus';
    case 'up':
    case 'k':
      return focus === 'nav' ? 'navUp' : 'listUp';
    case 'down':
    case 'j':
      return focus === 'nav' ? 'navDown' : 'listDown';
    case 'left':
      return 'seekBack';
    case 'right':
      return 'seekForward';
    case 'enter':
    case 'return':
      return 'activate';
    case 'space':
      return 'togglePause';
    case 'n':
      return 'next';
    case 'p':
      return 'prev';
    case 'a':
      return 'enqueue';
    case 'c':
      return 'clearQueue';
    case '/':
      return 'searchFocus';
    case '?':
      return 'helpToggle';
    case 'escape':
      return focus === 'nav' ? null : 'focusNav';
    default:
      break;
  }

  if (ch === '?' || name === 'question') {
    return 'helpToggle';
  }
  if (ch === '/') {
    return 'searchFocus';
  }
  if (ch === ' ') {
    return 'togglePause';
  }
  if (ch === 'q') {
    return 'quit';
  }
  if (ch === 'n') {
    return 'next';
  }
  if (ch === 'p') {
    return 'prev';
  }
  if (ch === 'a') {
    return 'enqueue';
  }
  if (ch === 'c') {
    return 'clearQueue';
  }
  if (ch === 'j') {
    return focus === 'nav' ? 'navDown' : 'listDown';
  }
  if (ch === 'k') {
    return focus === 'nav' ? 'navUp' : 'listUp';
  }

  return null;
}

export const HELP_TEXT = `tahti shell — keys

  Tab           Focus nav ↔ list
  ↑/↓ or j/k    Move selection
  Enter         Play selection
  a             Add to queue (tracks only)
  c             Clear queue
  Space         Play / pause
  n / p         Next / previous (queue)
  ← / →         Seek ±5s
  /             Search (on Search view)
  ?             This help
  q             Quit

Requires mpv on PATH. Auth: TAHTI_API_TOKEN (library) + TAHTI_API_URL.`;
