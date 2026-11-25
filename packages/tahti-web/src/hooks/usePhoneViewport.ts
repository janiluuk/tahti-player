import { useMediaQuery } from '@tahti-player/ui';

import { PHONE_QUERY } from '../lib/trackListViewResolve';

/** True on phone-width viewports; false where `matchMedia` is missing. */
export function usePhoneViewport(): boolean {
  return useMediaQuery(PHONE_QUERY);
}
