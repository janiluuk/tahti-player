export function isAudioEditorPath(pathname: string): boolean {
  return /^\/studio\/(?:archive\/[^/]+\/editor|editor\/[^/]+|sounds\/[^/]+\/editor)$/.test(
    pathname,
  );
}
