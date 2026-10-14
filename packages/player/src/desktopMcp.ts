import { listen } from '@tauri-apps/api/event';

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

/** Lets tahti-web start the MCP and MPD servers and answers their bridge requests. */
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
  await listen('bridge:request', (event) => {
    if (isBridgeRequest(event.payload)) {
      void answer(event.payload);
    }
  });
}

export { initDesktopMcp, initDesktopMpd };
