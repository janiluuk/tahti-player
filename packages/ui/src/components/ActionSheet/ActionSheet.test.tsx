import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { ActionSheet } from '.';

const StatefulSheet = ({
  onShare,
  onPin,
}: {
  onShare: () => void;
  onPin: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <ActionSheet
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      label="Track options"
    >
      <ActionSheet.Header title="Moody Electronica" subtitle="Yaniho" />
      <ActionSheet.Action onClick={onShare}>Share</ActionSheet.Action>
      <ActionSheet.Action onClick={onPin} keepOpen>
        Pin
      </ActionSheet.Action>
    </ActionSheet>
  );
};

describe('ActionSheet', () => {
  it('renders nothing when closed', () => {
    render(
      <ActionSheet isOpen={false} onClose={vi.fn()} label="Track options">
        <ActionSheet.Action onClick={vi.fn()}>Share</ActionSheet.Action>
      </ActionSheet>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows header and exposes the accessible label', () => {
    render(<StatefulSheet onShare={vi.fn()} onPin={vi.fn()} />);
    expect(
      screen.getByRole('dialog', { name: 'Track options' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Moody Electronica')).toBeInTheDocument();
    expect(screen.getByText('Yaniho')).toBeInTheDocument();
  });

  it('runs the action and closes the sheet', async () => {
    const onShare = vi.fn();
    render(<StatefulSheet onShare={onShare} onPin={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Share' }));
    expect(onShare).toHaveBeenCalledOnce();
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('keeps the sheet open for keepOpen actions', async () => {
    const onPin = vi.fn();
    render(<StatefulSheet onShare={vi.fn()} onPin={onPin} />);
    await userEvent.click(screen.getByRole('button', { name: 'Pin' }));
    expect(onPin).toHaveBeenCalledOnce();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
