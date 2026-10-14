import { emit, listen } from '@tauri-apps/api/event';

import { initDesktopDiscord } from '../../tahti-web/src/lib/discord/presence';
import {
  dispatchJam,
  JAM_METHOD_PREFIX,
} from '../../tahti-web/src/lib/jam/bridge';
import { initDesktopJam } from '../../tahti-web/src/lib/jam/desktop';
import { initDesktopMcp } from '../../tahti-web/src/lib/mcp/desktop';
import { dispatchMcp } from '../../tahti-web/src/lib/mcp/registry';
import {
  dispatchMpd,
  MPD_METHOD_PREFIX,
} from '../../tahti-web/src/lib/mpd/bridge';
import { initDesktopMpd } from '../../tahti-web/src/lib/mpd/desktop';
import { commands } from './services/tauri/bindings';
import { unwrapResult } from './services/tauri/results';

type BridgeRequest = {
  traceId: string;
  method: string;
  params?: Record<string, unknown> | null;
};

function isBridgeRequest(value: unknown): value is BridgeRequest {
  const request = value as BridgeRequest | null;
  return (
    typeof request?.traceId === 'string' && typeof request.method === 'string'
  );
}

async function answer(request: BridgeRequest) {
  try {
    const dispatch = request.method.startsWith(MPD_METHOD_PREFIX)
      ? dispatchMpd
      : request.method.startsWith(JAM_METHOD_PREFIX)
        ? dispatchJam
        : dispatchMcp;
    const data = await dispatch(request.method, request.params ?? {});
    await commands.bridgeRespond({
      traceId: request.traceId,
      status: 'success',
      data: data ?? null,
    });
  } catch (error) {
    await commands.bridgeRespond({
      traceId: request.traceId,
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Lets tahti-web start the MCP, MPD and Tahti Jam servers and Discord Rich Presence, and answers the servers' bridge requests. */
export async function installDesktopMcp(): Promise<void> {
  globalThis.__TAHTI_NATIVE_MCP__ = {
    start: async () => unwrapResult(await commands.mcpStart()),
    stop: async () => {
      unwrapResult(await commands.mcpStop());
    },
  };
  globalThis.__TAHTI_NATIVE_MPD__ = {
    start: async () => unwrapResult(await commands.mpdStart()),
    stop: async () => {
      unwrapResult(await commands.mpdStop());
    },
    notify: (subsystem) => {
      void commands.bridgeNotify({ subsystem });
    },
  };
  globalThis.__TAHTI_NATIVE_JAM__ = {
    start: async (pairingToken) => {
      const started = unwrapResult(await commands.httpApiStart(pairingToken));
      return { port: started.port, lanAddress: started.lan_address };
    },
    stop: async () => {
      unwrapResult(await commands.httpApiStop());
    },
    send: (kind, data) => {
      void emit(`remote:${kind}`, data);
    },
  };
  globalThis.__TAHTI_NATIVE_DISCORD__ = {
    start: async () => {
      unwrapResult(await commands.discordConnect());
    },
    stop: async () => {
      unwrapResult(await commands.discordDisconnect());
    },
    setActivity: async (presence) =>
      unwrapResult(await commands.discordSetActivity(presence)),
    clearActivity: async () => {
      unwrapResult(await commands.discordClearActivity());
    },
  };
  await listen('bridge:request', (event) => {
    if (isBridgeRequest(event.payload)) {
      void answer(event.payload);
    }
  });
}

export { initDesktopDiscord, initDesktopJam, initDesktopMcp, initDesktopMpd };
