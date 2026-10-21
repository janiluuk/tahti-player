import { useNavigate } from '@tanstack/react-router';
import { Link2Icon } from 'lucide-react';
import { useState } from 'react';

import { Button, Input, PluginStoreItem } from '@tahti-player/ui';

import { toolSourceAdapter } from '../../../plugins/import-sources';
import { useSettingsModalStore } from '../../../stores/settingsModalStore';
import { ConfigurableCard } from '../shared';

/** Paste a DSP URL (Spotify/Bandcamp/etc.) to seed a smart-link target on a
 * release — not a track/album import, so it doesn't belong in the Import
 * list above. Ported from the retired Sources page's `url` tab; the
 * "Open releases editor" action closes Add-ons first since it's a real
 * navigation to a different page. */
export function DspUrlPasteCard() {
  const navigate = useNavigate();
  const [urlPaste, setUrlPaste] = useState('');
  const urlTool = toolSourceAdapter('url');

  return (
    <ConfigurableCard
      title={urlTool?.name ?? 'URL / DSP paste'}
      header={(open) => (
        <PluginStoreItem
          name={urlTool?.name ?? 'URL / DSP paste'}
          author="Tool"
          description={
            urlTool?.description ??
            'Paste Spotify/Bandcamp/etc. URLs to seed smart-link targets on a release.'
          }
          isInstalled={false}
          onInstall={open}
          labels={{ install: 'Configure' }}
        />
      )}
    >
      <p className="text-foreground-secondary text-sm">
        Paste a DSP URL to open Studio releases (smart-link targets).
      </p>
      <Input
        className="w-full"
        size="sm"
        value={urlPaste}
        onChange={(e) => setUrlPaste(e.target.value)}
        placeholder="https://open.spotify.com/track/…"
      />
      <Button
        size="sm"
        variant="secondary"
        onClick={() => {
          useSettingsModalStore.getState().close();
          void navigate({
            to: (urlTool?.studioDeepLink ?? '/studio/releases') as never,
          });
        }}
      >
        <Link2Icon size={16} aria-hidden className="mr-1.5" />
        Open releases editor
      </Button>
    </ConfigurableCard>
  );
}
