import { useEffect, useState } from 'react';

import type { ConnectionStatus } from '@tahti-player/ui';

import type { JamPlayback, JamQueue, JamSettings } from '../lib/jam/bridge';
import { JamUnpairedError, type JamClient } from './jamClient';

const RECONNECT_MS = 3000;
const MAX_RETRIES = 5;

export type JamRemoteState = {
  status: ConnectionStatus | 'unpaired';
  queue: JamQueue | null;
  playback: JamPlayback | null;
  settings: JamSettings;
};

const INITIAL: JamRemoteState = {
  status: 'connecting',
  queue: null,
  playback: null,
  settings: { shuffle: false, repeat: 'off' },
};

/** Loads the player's state, then follows its event stream, reconnecting a few times before giving up. */
export function useJamRemote(client: JamClient | null): JamRemoteState {
  const [state, setState] = useState<JamRemoteState>(
    client ? INITIAL : { ...INITIAL, status: 'unpaired' },
  );

  useEffect(() => {
    if (!client) {
      return;
    }
    let source: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let retries = 0;
    let cancelled = false;
    let unpaired = false;

    const sync = async () => {
      try {
        const [queue, playback, settings] = await Promise.all([
          client.queue(),
          client.playback(),
          client.settings(),
        ]);
        if (!cancelled) {
          setState((s) => ({ ...s, queue, playback, settings }));
        }
        return true;
      } catch (error) {
        if (!cancelled && error instanceof JamUnpairedError) {
          unpaired = true;
          setState((s) => ({ ...s, status: 'unpaired' }));
        }
        return false;
      }
    };

    const listen = <K extends 'queue' | 'playback' | 'settings'>(
      eventSource: EventSource,
      kind: K,
    ) =>
      eventSource.addEventListener(kind, (event) => {
        const data = JSON.parse((event as MessageEvent<string>).data);
        setState((s) => ({ ...s, [kind]: data }));
      });

    const connect = async () => {
      if (cancelled) {
        return;
      }
      if (!(await sync())) {
        if (cancelled) {
          return;
        }
        scheduleRetry();
        return;
      }
      const eventSource = new EventSource(client.eventsUrl);
      source = eventSource;
      listen(eventSource, 'queue');
      listen(eventSource, 'playback');
      listen(eventSource, 'settings');
      eventSource.addEventListener('open', () => {
        retries = 0;
        setState((s) => ({ ...s, status: 'connected' }));
      });
      eventSource.addEventListener('error', () => {
        if (source !== eventSource || cancelled) {
          return;
        }
        eventSource.close();
        source = null;
        scheduleRetry();
      });
    };

    const scheduleRetry = () => {
      if (unpaired) {
        return;
      }
      retries += 1;
      if (retries > MAX_RETRIES) {
        setState((s) => ({ ...s, status: 'failed' }));
        return;
      }
      setState((s) => ({ ...s, status: 'reconnecting' }));
      retry = setTimeout(() => void connect(), RECONNECT_MS);
    };

    void connect();
    return () => {
      cancelled = true;
      clearTimeout(retry);
      source?.close();
    };
  }, [client]);

  return state;
}
