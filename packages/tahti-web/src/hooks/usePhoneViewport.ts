import { useEffect, useState } from 'react';

import { PHONE_QUERY } from '../lib/trackListViewResolve';

const canMatch = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function';

/** True on phone-width viewports; false where `matchMedia` is missing. */
export function usePhoneViewport(): boolean {
  const [isPhone, setIsPhone] = useState(() =>
    canMatch() ? window.matchMedia(PHONE_QUERY).matches : false,
  );

  useEffect(() => {
    if (!canMatch()) {
      return;
    }
    const mql = window.matchMedia(PHONE_QUERY);
    const onChange = () => setIsPhone(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isPhone;
}
