# Desktop connection and chrome — 2026-09-05

- Production API health returned HTTP 200 but no CORS headers for
  `Origin: tauri://localhost`. Core fix is in `/tmp/tahti-p2`: permit exact
  native Tauri origins; reject lookalikes and general localhost production origins.
- Added periodic credentialed health probing beside the logo. A failed probe
  shows a red API disconnected pill; successful recovery removes it.
- Radio uses the available content width. Add-on category tabs form a vertical
  scroll region with up/down buttons; keyboard tab navigation is retained.
- Theme control shows Theme: Light / Dark; Dynamic sits on its own row.
- Visualizer preview fills its containing area.
- Desktop status bar remains visible with the compact player and when signed
  out. Full-screen player still hides it. History arrows are visible at narrow widths.

Pending: built-app visual verification and API deployment. A CORS fix alone
does not prove that cross-origin login cookies work in every native webview.
