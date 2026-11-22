# Phone menu: remove the tahti.live link

**Status:** open

Requested 2026-11-22: on phones, remove the "tahti.live" link from the menu.

The same item was already asked on 2026-11-03 (`ui-requests-2026-11-03.md`: "tahti.live in the top menu: not found in web code or live DOM"). A grep of tahti-web (`MobileChrome.tsx` drawer and bottom nav, `AppTopNav.tsx`, `SidebarBuildInfo.tsx`) on 2026-11-22 again finds no literal tahti.live link. Next places to check:

- The Android APK / PWA chrome (WebView title bar, the app's own menu, `packages/player` Tauri mobile shell).
- The build-info footer in the Settings modal / drawer (`SidebarBuildInfo`, `ConnectedSettingsModal` footer) showing a host name.
- A screenshot from the user of where the link shows, if neither of those has it.

Done when: the phone menu has no tahti.live link, with a test that the drawer/menu does not render it. Close the matching line in `ui-requests-2026-11-03.md`.
