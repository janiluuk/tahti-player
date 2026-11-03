import { useRouter } from '@tanstack/react-router';
import { useCallback, useState, useSyncExternalStore } from 'react';

export function editFlagFromSearch(raw: unknown): boolean {
  if (typeof raw === 'string') {
    const value = new URLSearchParams(raw).get('edit');
    return value === '1' || value === 'true';
  }
  if (raw && typeof raw === 'object' && 'edit' in raw) {
    const value = (raw as { edit?: unknown }).edit;
    return value === true || value === 1 || value === '1' || value === 'true';
  }
  return false;
}

export function useEditMode(): [boolean, (next: boolean) => void] {
  const router = useRouter({ warn: false }) as ReturnType<
    typeof useRouter
  > | null;
  const [localEditing, setLocalEditing] = useState(false);
  const subscribe = useCallback(
    (onChange: () => void) =>
      router ? router.history.subscribe(onChange) : () => undefined,
    [router],
  );
  const routedEditing = useSyncExternalStore(subscribe, () =>
    router ? editFlagFromSearch(router.history.location.search) : false,
  );
  const setEditing = useCallback(
    (next: boolean) => {
      if (!router) {
        setLocalEditing(next);
        return;
      }
      const { pathname, search } = router.state.location;
      const rest: Record<string, unknown> = {
        ...(search as Record<string, unknown>),
      };
      delete rest.edit;
      void router.navigate({
        to: pathname,
        search: next ? { ...rest, edit: true } : rest,
        replace: true,
      } as unknown as Parameters<typeof router.navigate>[0]);
    },
    [router],
  );
  return [router ? routedEditing : localEditing, setEditing];
}

export function editSearch(raw: Record<string, unknown>): { edit?: true } {
  return editFlagFromSearch(raw) ? { edit: true } : {};
}
