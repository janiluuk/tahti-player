import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { PublicChannel } from '../../api/types';
import { ChannelPageActions } from './ChannelPageActions';

vi.mock('../ChannelShareButton', () => ({
  ChannelShareButton: ({
    displayName,
    showTrigger = true,
  }: {
    displayName: string;
    showTrigger?: boolean;
  }) =>
    showTrigger ? (
      <button type="button" aria-label={`Share ${displayName}`}>
        Share
      </button>
    ) : null,
}));

vi.mock('../ReportButton', () => ({
  ReportButton: ({
    label,
    showTrigger = true,
  }: {
    label: string;
    showTrigger?: boolean;
  }) =>
    showTrigger ? (
      <button type="button" aria-label={`Report ${label}`}>
        Report
      </button>
    ) : null,
}));

vi.mock('../RssFeedButton', () => ({
  RssFeedButton: ({ label }: { label: string }) => (
    <button type="button" aria-label={`Copy the ${label}`}>
      RSS
    </button>
  ),
}));

vi.mock('./ChannelVizPackLabel', () => ({
  ChannelVizPackLabel: () => null,
}));

const channel = {
  slug: 'night-drive',
  state: 'OFFLINE',
  user: {
    displayName: 'Night Drive',
    username: 'nightdrive',
    showShareButton: true,
  },
} as PublicChannel;

describe('ChannelPageActions', () => {
  it('leaves air status to the stage player and offers a More menu for overflow actions', () => {
    render(
      <ChannelPageActions
        channel={channel}
        slug="night-drive"
        isOwner={false}
        isAdministrator={false}
      />,
    );

    expect(screen.getByTestId('channel-page-actions')).toBeInTheDocument();
    expect(screen.queryByText('Offline')).toBeNull();
    expect(
      screen.getByRole('button', { name: 'More channel actions' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Share Night Drive' }),
    ).toBeInTheDocument();
  });

  it('offers Follow on an off-air channel and reflects Following', () => {
    const toggle = vi.fn();
    const { rerender } = render(
      <ChannelPageActions
        channel={channel}
        slug="night-drive"
        isOwner={false}
        isAdministrator={false}
        follow={{ following: false, busy: false, toggle }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Follow' }));
    expect(toggle).toHaveBeenCalled();

    rerender(
      <ChannelPageActions
        channel={channel}
        slug="night-drive"
        isOwner={false}
        isAdministrator={false}
        follow={{ following: true, busy: false, toggle }}
      />,
    );
    expect(screen.getByRole('button', { name: 'Following' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('keeps the RSS feed inside Share, and shows it alone when Share is hidden', () => {
    const { rerender } = render(
      <ChannelPageActions
        channel={channel}
        slug="night-drive"
        isOwner={false}
        isAdministrator={false}
      />,
    );
    expect(screen.queryByRole('button', { name: /RSS feed/ })).toBeNull();

    rerender(
      <ChannelPageActions
        channel={{
          ...channel,
          user: { ...channel.user, showShareButton: false },
        }}
        slug="night-drive"
        isOwner={false}
        isAdministrator={false}
      />,
    );
    expect(
      screen.getByRole('button', { name: /RSS feed of Night Drive/ }),
    ).toBeInTheDocument();
  });
});
