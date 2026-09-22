import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { DeliveryTab } from './DeliveryTab';

function ControlledDeliveryTab({ onSubmit }: { onSubmit: () => void }) {
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  return (
    <DeliveryTab
      revelatorStatus={null}
      revelatorId={null}
      billing={null}
      busy={false}
      canSubmit
      confirmSubmit={confirmSubmit}
      setConfirmSubmit={setConfirmSubmit}
      onSubmit={onSubmit}
      showRoyalties={false}
      royaltiesLoaded={false}
      royalties={[]}
    />
  );
}

describe('DeliveryTab submit-to-Revelator confirmation', () => {
  it('asks for confirmation before paying and submitting to stores', () => {
    const onSubmit = vi.fn();
    render(<ControlledDeliveryTab onSubmit={onSubmit} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Submit to Revelator' }),
    );

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Submit to Revelator?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('submits nothing when the confirmation is cancelled', () => {
    const onSubmit = vi.fn();
    render(<ControlledDeliveryTab onSubmit={onSubmit} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Submit to Revelator' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('disables the button while busy or when submission is not allowed', () => {
    const { rerender } = render(
      <DeliveryTab
        revelatorStatus={null}
        revelatorId={null}
        billing={null}
        busy={false}
        canSubmit={false}
        confirmSubmit={false}
        setConfirmSubmit={() => {}}
        onSubmit={() => {}}
        showRoyalties={false}
        royaltiesLoaded={false}
        royalties={[]}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Submit to Revelator' }),
    ).toBeDisabled();

    rerender(
      <DeliveryTab
        revelatorStatus={null}
        revelatorId={null}
        billing={null}
        busy
        canSubmit
        confirmSubmit={false}
        setConfirmSubmit={() => {}}
        onSubmit={() => {}}
        showRoyalties={false}
        royaltiesLoaded={false}
        royalties={[]}
      />,
    );
    expect(screen.getByRole('button', { name: /Submitting/ })).toBeDisabled();
  });
});
