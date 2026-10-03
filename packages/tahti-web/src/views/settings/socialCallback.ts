const PLATFORM_NAMES: Record<string, string> = {
  twitter: 'X / Twitter',
  instagram: 'Instagram',
};

export type SocialCallbackToast = {
  kind: 'success' | 'error';
  message: string;
};

/** Maps the `?social=<platform>_<connected|error>` value the API OAuth
 * callbacks redirect with to a toast. Unknown values return null. */
export function socialCallbackToast(
  value: string | null,
): SocialCallbackToast | null {
  const match = value?.match(/^([a-z]+)_(connected|error)$/);
  const name = match ? PLATFORM_NAMES[match[1]!] : undefined;
  if (!match || !name) {
    return null;
  }
  return match[2] === 'connected'
    ? { kind: 'success', message: `${name} connected.` }
    : { kind: 'error', message: `Could not connect ${name}. Try again.` };
}
