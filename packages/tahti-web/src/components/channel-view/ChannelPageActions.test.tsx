// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PublicChannel } from '../../api/types';
import { ChannelPageActions } from './ChannelPageActions';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

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
    ) : (
      <div data-testid="share-dialog-host" />
    ),
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
    ) : (
      <div data-testid="report-dialog-host" />
    ),
}));

vi.mock('../RssFeedButton', () => ({
  RssFeedButton: ({ label }: { label: string }) => (
    <button type="button" aria-label={`Copy the ${label}`}>
      RSS
    </button>
  ),
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
  afterEach(() => {
    cleanup();
  });

  it('keeps Share / RSS / Report on desktop and folds them into More on phone', () => {
    render(
      <ChannelPageActions
        channel={channel}
        slug="night-drive"
        isOwner={false}
      />,
    );

    const desktop = screen.getByTestId('channel-page-actions-desktop');
    const phone = screen.getByTestId('channel-page-actions-phone');
    expect(desktop.className).toContain('hidden');
    expect(desktop.className).toContain('sm:flex');
    expect(phone.className).toContain('sm:hidden');

    expect(
      screen.getByRole('button', { name: 'Share Night Drive' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', {
        name: "Copy the RSS feed of Night Drive's channel",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Report Night Drive' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'More channel actions' }),
    ).toBeTruthy();
  });

  it('lists Share, RSS and Report in the phone More menu', async () => {
    render(
      <ChannelPageActions
        channel={channel}
        slug="night-drive"
        isOwner={false}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'More channel actions' }),
    );

    expect(await screen.findByRole('button', { name: 'Share' })).toBeTruthy();
    expect(
      await screen.findByRole('button', { name: 'Copy RSS feed' }),
    ).toBeTruthy();
    expect(await screen.findByRole('button', { name: 'Report' })).toBeTruthy();
    expect(screen.getByTestId('share-dialog-host')).toBeTruthy();
    expect(screen.getByTestId('report-dialog-host')).toBeTruthy();
  });

  it('puts Edit design in the More menu for owners and omits Report', async () => {
    const onEditDesign = vi.fn();
    render(
      <ChannelPageActions
        channel={channel}
        slug="night-drive"
        isOwner
        onEditDesign={onEditDesign}
      />,
    );

    expect(screen.getByRole('button', { name: 'Edit design' })).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: 'Report Night Drive' }),
    ).toBeNull();

    fireEvent.click(
      screen.getByRole('button', { name: 'More channel actions' }),
    );
    const editItems = await screen.findAllByRole('button', {
      name: 'Edit design',
    });
    expect(editItems.length).toBeGreaterThan(1);
    fireEvent.click(editItems[editItems.length - 1]!);
    expect(onEditDesign).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Report' })).toBeNull();
  });
});
