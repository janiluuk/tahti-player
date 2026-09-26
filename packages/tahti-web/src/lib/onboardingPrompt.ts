const ONBOARDED_KEY_PREFIX = 'tahti-web-onboarded:';
/** Session-only: toast was already offered (or deferred) this browser
 * session — survives reload, resets when the tab/session ends. */
const ONBOARDING_DEFERRED_PREFIX = 'tahti-web-onboarding-deferred:';

export function markOnboardingSeen(userId: string) {
  try {
    localStorage.setItem(`${ONBOARDED_KEY_PREFIX}${userId}`, '1');
  } catch {
    // Private-browsing/storage-disabled — worst case onboarding shows again.
  }
  try {
    sessionStorage.setItem(`${ONBOARDING_DEFERRED_PREFIX}${userId}`, '1');
  } catch {
    // ignore
  }
}

/** Soft-suppress for the rest of this browser session (toast timed out or
 * was shown once). Does not permanently skip onboarding. */
export function deferOnboardingPrompt(userId: string) {
  try {
    sessionStorage.setItem(`${ONBOARDING_DEFERRED_PREFIX}${userId}`, '1');
  } catch {
    // ignore
  }
}

export function hasSeenOnboarding(userId: string): boolean {
  try {
    return localStorage.getItem(`${ONBOARDED_KEY_PREFIX}${userId}`) === '1';
  } catch {
    return true;
  }
}

export function hasDeferredOnboardingPrompt(userId: string): boolean {
  try {
    return (
      sessionStorage.getItem(`${ONBOARDING_DEFERRED_PREFIX}${userId}`) === '1'
    );
  } catch {
    return false;
  }
}
