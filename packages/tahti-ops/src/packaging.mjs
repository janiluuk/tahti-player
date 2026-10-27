import { createHash } from 'node:crypto';

import { OpsError } from './paths.mjs';

/** Like `envsubst '$A $B'`: only the named `${VAR}`s are replaced, so
 * PKGBUILD / manifest variables such as `${pkgver}` stay as they are. */
export function renderTemplate(template, vars) {
  return template.replace(/\$\{([A-Z0-9_]+)\}/g, (match, name) =>
    Object.hasOwn(vars, name) ? vars[name] : match,
  );
}

export async function sha256OfUrl(url, fetchImpl = fetch) {
  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new OpsError(`Download failed (${response.status}): ${url}`);
  }
  const hash = createHash('sha256');
  for await (const chunk of response.body) {
    hash.update(chunk);
  }
  return hash.digest('hex');
}
