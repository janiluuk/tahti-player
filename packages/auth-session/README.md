# `@tahti-player/auth-session`

Framework-free access-token holder with single-flight refresh. Used by
`tahti-web` (cookie refresh) and available to desktop/CLI hosts via storage
adapters.

## Storage adapters

| Adapter | Use |
| --- | --- |
| `createBrowserCookieStorage` | Web / Tauri webview — refresh cookie only |
| `createMemoryStorage` | Tests |
| `createNodeConfigFileStorage(path)` | Node CLI config file (`0600`) |
| `createInjectedStorage({ getRefreshToken, setRefreshToken })` | Desktop OS keychain (or any host bridge) |

Desktop next step: wire `createInjectedStorage` to a Tauri keychain plugin,
call `authSession.start()` on wake/`online` (already listens in browsers), and
verify offline cold start keeps signed-in until refresh fails.
