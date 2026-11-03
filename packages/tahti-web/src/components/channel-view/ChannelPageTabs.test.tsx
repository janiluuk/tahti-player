// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChannelPageSections } from './ChannelPageTabs';

vi.mock('../ChannelComments', () => ({
  ChannelComments: () => <p>Comments wall</p>,
}));
vi.mock('../ChannelChatPanel', () => ({
  ChannelChatPanel: () => <p>Chat room</p>,
}));

function renderSections(
  props: Partial<Parameters<typeof ChannelPageSections>[0]> = {},
) {
  const onTabChange = vi.fn();
  render(
    <ChannelPageSections
      tab="music"
      onTabChange={onTabChange}
      editing={false}
      chatOn
      slug="night-drive"
      isOwner={false}
      music={<p>Music blocks</p>}
      {...props}
    />,
  );
  return onTabChange;
}

const tabNames = () =>
  screen.queryAllByRole('tab').map((tab) => tab.textContent);

describe('ChannelPageSections', () => {
  afterEach(cleanup);

  it('shows Embeds between Music and Comments only when there are embeds', () => {
    renderSections();
    expect(tabNames()).toEqual(['Music', 'Comments', 'Chat']);
    cleanup();

    const onTabChange = renderSections({ embeds: <p>Embed rows</p> });
    expect(tabNames()).toEqual(['Music', 'Embeds', 'Comments', 'Chat']);
    act(() => {
      fireEvent.click(screen.getByRole('tab', { name: 'Embeds' }));
    });
    expect(onTabChange).toHaveBeenCalledWith('embeds');
  });

  it('renders the Embeds content on its tab', () => {
    renderSections({ tab: 'embeds', embeds: <p>Embed rows</p> });
    expect(screen.getByText('Embed rows')).toBeTruthy();
    expect(screen.queryByText('Music blocks')).toBeNull();
  });

  it('falls back to Music when the embeds are gone or while editing', () => {
    renderSections({ tab: 'embeds', embeds: null });
    expect(screen.getByText('Music blocks')).toBeTruthy();
    cleanup();

    renderSections({ tab: 'embeds', embeds: <p>Embed rows</p>, editing: true });
    expect(screen.getByText('Music blocks')).toBeTruthy();
    expect(screen.queryByRole('tab')).toBeNull();
  });
});
