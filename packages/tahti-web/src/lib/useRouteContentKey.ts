import { useTranslation } from '@tahti-player/i18n';

/** Key for the routed page tree: a new user or a new language remounts the
 * page so labels read through `webT()` / `i18n.t` outside a hook pick up the
 * language, while the shell around it (player, audio, nav) stays mounted. */
export function useRouteContentKey(userId: string | undefined): string {
  const { i18n } = useTranslation('web');
  return `${userId ?? 'anonymous'}:${i18n.language}`;
}
