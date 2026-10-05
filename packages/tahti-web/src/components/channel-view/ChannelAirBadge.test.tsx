import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ChannelAirBadge, channelAirState } from './ChannelAirBadge';

const HLS = 'https://hls.example/live/a/index.m3u8';

describe('channelAirState', () => {
  it('is on air only with a connected broadcast signal', () => {
    expect(
      channelAirState({ state: 'LIVE', hlsUrl: HLS, signalConnected: true }),
    ).toBe('on-air');
  });

  it('calls a live stream with no signal the 24/7 rotation', () => {
    expect(
      channelAirState({ state: 'LIVE', hlsUrl: HLS, signalConnected: false }),
    ).toBe('rotation');
  });

  it('keeps the old meaning when the API sends no signal field', () => {
    expect(channelAirState({ state: 'LIVE', hlsUrl: HLS })).toBe('on-air');
  });

  it('is offline without a stream', () => {
    expect(
      channelAirState({ state: 'LIVE', hlsUrl: null, signalConnected: true }),
    ).toBe('offline');
    expect(channelAirState({ state: 'OFFLINE', hlsUrl: null })).toBe('offline');
  });
});

describe('ChannelAirBadge', () => {
  afterEach(cleanup);

  it('shows the red badge for a real broadcast', () => {
    render(
      <ChannelAirBadge
        channel={{ state: 'LIVE', hlsUrl: HLS, signalConnected: true }}
      />,
    );
    expect(screen.getByText('ON AIR')).toBeTruthy();
  });

  it('does not claim on air while the rotation plays', () => {
    render(
      <ChannelAirBadge
        channel={{ state: 'LIVE', hlsUrl: HLS, signalConnected: false }}
      />,
    );
    expect(screen.queryByText('ON AIR')).toBeNull();
    expect(screen.getByText('24/7 rotation')).toBeTruthy();
  });

  it('says offline in plain words', () => {
    render(<ChannelAirBadge channel={{ state: 'OFFLINE', hlsUrl: null }} />);
    expect(screen.getByText('Offline')).toBeTruthy();
  });
});
