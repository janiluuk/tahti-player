import { useState } from 'react';

import { useAuthStore } from '../stores/authStore';
import { MySupportTickets } from './MySupportTickets';
import { SupportContactForm } from './SupportContactForm';

export function SupportCenter() {
  const signedIn = useAuthStore((s) => Boolean(s.user));
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      {signedIn && <MySupportTickets refreshKey={refreshKey} />}
      <SupportContactForm onSubmitted={() => setRefreshKey((k) => k + 1)} />
    </div>
  );
}
