import type { RouterState } from '@tanstack/react-router';

export function navigationPathname(
  state: Pick<RouterState, 'status' | 'location' | 'resolvedLocation'>,
): string {
  if (state.status === 'pending' && state.resolvedLocation) {
    return state.resolvedLocation.pathname;
  }
  return state.location.pathname;
}
