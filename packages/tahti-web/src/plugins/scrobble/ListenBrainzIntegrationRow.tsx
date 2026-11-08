import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
import { Button, Dialog, Input, SaveButton } from '@tahti-player/ui';

import {
  fetchMeIntegrations,
  installMeIntegration,
  uninstallMeIntegration,
} from '../../api/integrations';
import { SettingsToggle } from '../../views/settings/SettingsFields';

/** Settings → Integrations row: toggle on opens the token dialog, off disconnects. */
export function ListenBrainzIntegrationRow() {
  const { t } = useTranslation('web');
  const [open, setOpen] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      const { data } = await fetchMeIntegrations();
      const row = data.find((entry) => entry.slug === 'listenbrainz');
      setInstalled(Boolean(row?.installed));
    } catch {
      setInstalled(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const saveAndEnable = async () => {
    const trimmed = token.trim();
    if (!trimmed) {
      toast.error(i18n.t('web:toasts.listenBrainzTokenRequired'));
      return;
    }
    setBusy(true);
    const result = await installMeIntegration('listenbrainz', {
      userToken: trimmed,
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setInstalled(true);
    setOpen(false);
    setToken('');
    toast.success(i18n.t('web:toasts.listenBrainzEnabled'));
    void refresh();
  };

  const remove = async () => {
    setBusy(true);
    const result = await uninstallMeIntegration('listenbrainz');
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setInstalled(false);
    setToken('');
    toast.success(i18n.t('web:toasts.listenBrainzDisconnected'));
  };

  return (
    <>
      <div
        className="flex flex-col gap-2"
        data-testid="integration-listenbrainz"
      >
        <SettingsToggle
          label={t('listenBrainzRow.listenbrainzScrobbling')}
          description={t('listenBrainzRow.whenATahtiTrackCounts')}
          value={installed}
          onChange={(next) => {
            if (busy) {
              return;
            }
            if (next) {
              setOpen(true);
            } else {
              void remove();
            }
          }}
        />
        {installed ? (
          <Button
            size="sm"
            variant="text"
            className="self-start"
            onClick={() => setOpen(true)}
          >
            {t('listenBrainzRow.updateToken')}
          </Button>
        ) : null}
      </div>
      <Dialog.Root
        isOpen={open}
        onClose={() => setOpen(false)}
        className="max-w-lg"
      >
        <Dialog.Title>
          {t('listenBrainzRow.configureListenbrainz')}
        </Dialog.Title>
        <Dialog.Description>
          {t('listenBrainzRow.pasteTheUserTokenFrom')}
        </Dialog.Description>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void saveAndEnable();
          }}
        >
          <div className="mt-4 flex flex-col gap-3">
            <Input
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              label={t('listenBrainzRow.userToken')}
              type="password"
              autoComplete="off"
              description={t(
                'listenBrainzRow.fromListenbrainzOrgSettingsMusic',
              )}
              value={token}
              onChange={(event) => setToken(event.target.value)}
            />
            {installed ? (
              <p className="text-foreground-secondary text-sm">
                {t('listenBrainzRow.alreadyConnectedSavingANew')}
              </p>
            ) : null}
          </div>
          <Dialog.Actions>
            <Dialog.Close>{t('listenBrainzRow.cancel')}</Dialog.Close>
            <SaveButton
              size="sm"
              saving={busy}
              disabled={busy || !token.trim()}
              type="submit"
              label={installed ? 'Update token' : 'Save and enable'}
              savingLabel="Saving…"
            />
          </Dialog.Actions>
        </form>
      </Dialog.Root>
    </>
  );
}
