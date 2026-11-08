import { useState } from 'react';

import { useAuthStore } from '../stores/authStore';
import { MySupportTickets } from './MySupportTickets';
import {
  SUPPORT_CONTACT_FORM_ID,
  SupportContactForm,
} from './SupportContactForm';

export function SupportCenter() {
  const signedIn = useAuthStore((s) => Boolean(s.user));
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      {signedIn && (
        <MySupportTickets
          refreshKey={refreshKey}
          onNewRequest={() => {
            const form = document.getElementById(SUPPORT_CONTACT_FORM_ID);
            form?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            form
              ?.querySelector<HTMLElement>('input, select, textarea')
              ?.focus({ preventScroll: true });
          }}
        />
      )}
      <SupportContactForm onSubmitted={() => setRefreshKey((k) => k + 1)} />
    </div>
  );
}
