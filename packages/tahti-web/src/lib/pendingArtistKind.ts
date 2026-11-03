const STORAGE_KEY = 'tahti.pendingArtistKind';

export type ArtistKind = 'SINGLE' | 'COLLECTIVE';

export function persistPendingArtistKind(kind: ArtistKind): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, kind);
  } catch {
    // Private mode / quota — onboarding will fall back to the profile default.
  }
}

export function takePendingArtistKind(): ArtistKind | null {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    if (value === 'SINGLE' || value === 'COLLECTIVE') {
      return value;
    }
  } catch {
    // ignore
  }
  return null;
}

const LISTENER_SIGNUP_KEY = 'tahti.signedUpAsListener';

export function persistListenerSignup(): void {
  try {
    localStorage.setItem(LISTENER_SIGNUP_KEY, '1');
  } catch {
    return;
  }
}

export function takeListenerSignup(): boolean {
  try {
    const value = localStorage.getItem(LISTENER_SIGNUP_KEY) === '1';
    localStorage.removeItem(LISTENER_SIGNUP_KEY);
    return value;
  } catch {
    return false;
  }
}
