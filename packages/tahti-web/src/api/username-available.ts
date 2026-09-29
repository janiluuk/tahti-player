import { getJson } from './http';
import { isForceMock } from './mode';

export type UsernameAvailability = {
  available: boolean;
  suggestions?: string[];
};

const MOCK_TAKEN = new Set(['demo', 'tahti']);

/** Null when the check itself failed (bad input or network), so the form
 * doesn't claim a handle is free or taken without knowing. */
export async function fetchUsernameAvailability(
  username: string,
): Promise<UsernameAvailability | null> {
  if (isForceMock()) {
    return MOCK_TAKEN.has(username)
      ? {
          available: false,
          suggestions: [`${username}-live`, `${username}-music`],
        }
      : { available: true };
  }
  try {
    return await getJson<UsernameAvailability>(
      `/api/auth/username-available?username=${encodeURIComponent(username)}`,
    );
  } catch {
    return null;
  }
}
