import { DISCO_WIDGET_ROOT_ELEMENT_ID } from './disco-widget-protocol';
import {
  bundleHashToIntegrity,
  isValidBundleHashHex,
} from './disco-widget-sri';

function bundleSrcForHash(bundleHash: string): string {
  return `/widget-sandbox/bundle/${bundleHash}`;
}

/** Hand-written sandbox document: the only script it ever references is the
 * approved widget bundle. Matches tahti-org's Next `/widget-sandbox/[hash]`
 * route so a reviewed bundle sees the same mount contract here. */
export function sandboxDocumentHtml(
  bundleHash: string,
  options: { includeIntegrity?: boolean } = {},
): string | null {
  if (!isValidBundleHashHex(bundleHash)) {
    return null;
  }
  const bundleSrc = bundleSrcForHash(bundleHash);
  const integrity =
    options.includeIntegrity === false
      ? ''
      : ` integrity="${bundleHashToIntegrity(bundleHash)}"`;
  return `<!doctype html>
<html>
<head><meta charset="utf-8"></head>
<body>
<div id="${DISCO_WIDGET_ROOT_ELEMENT_ID}"></div>
<script type="module" src="${bundleSrc}"${integrity}></script>
</body>
</html>`;
}
