import { Trash2Icon, UserRoundPlusIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
import { Button, Input, Tooltip } from '@tahti-player/ui';

import {
  addModerator,
  fetchModerators,
  removeModerator,
  type ModeratorRow,
} from '../../api/artist-settings';
import { toastWithUndo } from '../../lib/undoToast';
import { ConfirmDialog } from '../ConfirmDialog';
import { PageEmpty, PageLoading } from '../PageStates';
import { StudioPanel } from '../StudioPanel';

/** The people the channel owner trusts to moderate the channel's chat:
 * the list, adding one by username, and removing one after a confirm. */
export function ChannelModeratorsPanel() {
  const { t } = useTranslation('web');
  const [mods, setMods] = useState<ModeratorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [pendingRemove, setPendingRemove] = useState<ModeratorRow | null>(null);

  const reload = useCallback(() => {
    void fetchModerators().then((result) => {
      setMods(result.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // People paste handles with the @ in front; the API wants the bare name.
  const handle = username.trim().replace(/^@+/, '');
  const usernameRef = useRef<HTMLInputElement>(null);

  const add = () => {
    if (!handle) {
      return;
    }
    void addModerator(handle).then((result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setUsername('');
      const created = result.data;
      toastWithUndo(
        t('channelModerators.added', { name: created.displayName }),
        {
          undo: () => removeModerator(created.id),
          undoneMessage: t('channelModerators.undone', {
            name: created.displayName,
          }),
          onUndone: () => reload(),
        },
      );
      reload();
    });
  };

  return (
    <StudioPanel
      title={t('channelModerators.title')}
      description={t('channelModerators.description')}
    >
      <div className="flex flex-col gap-4">
        {loading ? (
          <PageLoading label={t('loading.loading')} />
        ) : mods.length === 0 ? (
          <PageEmpty
            title={t('empties.noModerators')}
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => usernameRef.current?.focus()}
              >
                <UserRoundPlusIcon size={16} aria-hidden />
                {t('emptyActions.addFirstModerator')}
              </Button>
            }
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {mods.map((moderator) => (
              <li
                key={moderator.id}
                className="border-border flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <span>
                  {moderator.displayName} (@{moderator.username})
                </span>
                <Tooltip content={t('channelModerators.remove')} side="top">
                  <Button
                    size="icon-sm"
                    variant="text"
                    aria-label={t('channelModerators.removeNamed', {
                      name: moderator.displayName,
                    })}
                    onClick={() => setPendingRemove(moderator)}
                  >
                    <Trash2Icon
                      className="text-accent-red"
                      size={14}
                      aria-hidden
                    />
                  </Button>
                </Tooltip>
              </li>
            ))}
          </ul>
        )}
        <form
          className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            add();
          }}
        >
          <Input
            ref={usernameRef}
            enterKeyHint="go"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            label={t('channelModerators.username')}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder={t('channelModerators.usernamePlaceholder')}
            className="min-w-0 sm:min-w-48"
          />
          <Tooltip content={t('channelModerators.add')} side="top">
            <Button
              size="icon-sm"
              disabled={!handle}
              aria-label={t('channelModerators.add')}
              type="submit"
            >
              <UserRoundPlusIcon size={15} aria-hidden />
            </Button>
          </Tooltip>
        </form>
      </div>
      <ConfirmDialog
        isOpen={pendingRemove !== null}
        destructive
        title={
          pendingRemove
            ? t('channelModerators.removeConfirmNamed', {
                name: pendingRemove.displayName,
              })
            : t('channelModerators.removeConfirm')
        }
        description={t('channelModerators.removeConfirmDescription')}
        confirmLabel={t('actions.remove')}
        onCancel={() => setPendingRemove(null)}
        onConfirm={() => {
          const moderator = pendingRemove;
          setPendingRemove(null);
          if (!moderator) {
            return;
          }
          void removeModerator(moderator.id).then((result) => {
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success(i18n.t('web:toasts.moderatorRemoved'));
            reload();
          });
        }}
      />
    </StudioPanel>
  );
}
