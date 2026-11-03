/** postMessage wire protocol between a Disco-widget sandbox iframe and the
 * host page. Copied from tahti-org `packages/widget-sdk/src/protocol.ts` so
 * this SPA does not depend on that package; keep the shapes in lockstep. */

export const DISCO_WIDGET_MESSAGE_SOURCE = 'disco-widget' as const;

export const DISCO_WIDGET_ROOT_ELEMENT_ID = 'disco-widget-root';

export type HostToWidgetMessage =
  | {
      source: typeof DISCO_WIDGET_MESSAGE_SOURCE;
      type: 'init';
      context: unknown;
      config: unknown;
    }
  | {
      source: typeof DISCO_WIDGET_MESSAGE_SOURCE;
      type: 'config-change';
      config: unknown;
    };

export type WidgetToHostMessage =
  | { source: typeof DISCO_WIDGET_MESSAGE_SOURCE; type: 'ready' }
  | {
      source: typeof DISCO_WIDGET_MESSAGE_SOURCE;
      type: 'resize';
      height: number;
    }
  | {
      source: typeof DISCO_WIDGET_MESSAGE_SOURCE;
      type: 'open-link';
      url: string;
    };

function hasDiscoWidgetSource(data: unknown): data is { source: unknown } {
  return typeof data === 'object' && data !== null && 'source' in data;
}

export function isWidgetToHostMessage(
  data: unknown,
): data is WidgetToHostMessage {
  return (
    hasDiscoWidgetSource(data) && data.source === DISCO_WIDGET_MESSAGE_SOURCE
  );
}
