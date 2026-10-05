import { SearchIcon } from 'lucide-react';
import { useState } from 'react';

import { Button, Dialog, Input, PluginStoreItem } from '@tahti-player/ui';

const SOULSEEK_ADDON = {
  id: 'soulseek',
  name: 'Soulseek',
  author: 'Desktop add-on',
  description:
    'Search and download from Soulseek into your local library. Requires the desktop Tahti Player — the browser cannot speak the Soulseek protocol.',
};

export function SoulseekAddonCard() {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');

  return (
    <>
      <PluginStoreItem
        icon={<SearchIcon size={22} aria-hidden />}
        name={SOULSEEK_ADDON.name}
        author={SOULSEEK_ADDON.author}
        description={SOULSEEK_ADDON.description}
        categories={['Desktop', 'Library']}
        isInstalled={false}
        onInstall={() => setOpen(true)}
        labels={{ install: 'Configure' }}
      />
      <Dialog.Root
        isOpen={open}
        onClose={() => setOpen(false)}
        className="max-w-lg"
      >
        <Dialog.Title>Configure Soulseek</Dialog.Title>
        <Dialog.Description>
          Soulseek is peer-to-peer. Tahti does not relay searches or files
          through its servers. You will connect with your own account from the
          desktop app. Sharing and downloading copyrighted material you do not
          have rights to is your responsibility.
        </Dialog.Description>
        <div className="mt-4 flex flex-col gap-3">
          <Input
            label="Soulseek username"
            description="Saved locally when the native bridge ships. Not sent to Tahti."
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="off"
          />
          <p className="text-foreground-secondary text-sm">
            Connection, listen port, shared folders, and search are not
            available in this browser session. Open the Library tab on the right
            rail to import local files in the meantime.
          </p>
        </div>
        <Dialog.Actions>
          <Dialog.Close>Close</Dialog.Close>
          <Button
            size="sm"
            disabled
            title="Soulseek connects from the desktop player only."
          >
            Desktop only
          </Button>
        </Dialog.Actions>
      </Dialog.Root>
    </>
  );
}
