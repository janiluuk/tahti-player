export function centrifugoWsUrl(): string | null {
  const fromEnv = import.meta.env.VITE_CENTRIFUGO_WS;
  if (fromEnv) {
    return fromEnv;
  }
  if (import.meta.env.DEV) {
    return 'ws://localhost:8000/connection/websocket';
  }
  return 'wss://chat.tahti.live/connection/websocket';
}
