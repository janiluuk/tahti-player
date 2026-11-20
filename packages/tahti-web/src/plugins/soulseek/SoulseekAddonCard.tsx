import { SearchIcon } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  Dialog,
  Input,
  PluginStoreItem,
  Tooltip,
} from '@tahti-player/ui';

export function SoulseekAddonCard() {
  const { t } = useTranslation('web');
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');

  return (
    <>
      <PluginStoreItem
        icon={<SearchIcon size={22} aria-hidden />}
        name="Soulseek"
        author={t('soulseekAddonCardBatch33.author')}
        description={t('soulseekAddonCardBatch33.description')}
        categories={[
          t('soulseekAddonCardBatch33.categoryDesktop'),
          t('soulseekAddonCardBatch33.categoryLibrary'),
        ]}
        isInstalled={false}
        onInstall={() => setOpen(true)}
        labels={{ install: t('soulseekAddonCardBatch33.configure') }}
      />
      <Dialog.Root
        isOpen={open}
        onClose={() => setOpen(false)}
        className="max-w-lg"
      >
        <Dialog.Title>{t('soulseekCard.configureSoulseek')}</Dialog.Title>
        <Dialog.Description>
          {t('soulseekCard.soulseekIsPeerToPeer')}
        </Dialog.Description>
        <div className="mt-4 flex flex-col gap-3">
          <Input
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            label={t('soulseekCard.soulseekUsername')}
            description={t('soulseekCard.savedLocallyWhenTheNative')}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="off"
          />
          <p className="text-foreground-secondary text-sm">
            {t('soulseekCard.connectionListenPortSharedFolders')}
          </p>
        </div>
        <Dialog.Actions>
          <Dialog.Close>{t('soulseekCard.close')}</Dialog.Close>
          <Tooltip
            content={t('soulseekCard.soulseekConnectsFromTheDesktop')}
            side="top"
            wrapperClassName="inline-flex"
            multiline
          >
            <Button
              aria-description={t(
                'soulseekCard.soulseekConnectsFromTheDesktop',
              )}
              size="sm"
              variant="secondary"
              disabled
            >
              {t('soulseekCard.desktopOnly')}
            </Button>
          </Tooltip>
        </Dialog.Actions>
      </Dialog.Root>
    </>
  );
}
