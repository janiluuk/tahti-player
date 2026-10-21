import { CreditCardIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@tahti-player/ui';

import { startFanSubscriptionsPortal } from '../api/membership';
import { assignStripeRedirectUrl } from '../lib/stripeRedirect';

export function FanSubscriptionsBillingButton() {
  const [busy, setBusy] = useState(false);

  const open = async () => {
    setBusy(true);
    const result = await startFanSubscriptionsPortal();
    if (!result.ok) {
      setBusy(false);
      toast.error(result.error);
      return;
    }
    if (!assignStripeRedirectUrl(result.portalUrl)) {
      setBusy(false);
      toast.error('Billing portal URL was not from Stripe');
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={busy}
      onClick={() => void open()}
      className="self-start"
    >
      <CreditCardIcon size={14} aria-hidden className="mr-1.5" />
      {busy ? 'Opening…' : 'Payment method and receipts'}
    </Button>
  );
}
