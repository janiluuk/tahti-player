import { ExternalLinkIcon, PlayIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@tahti-player/ui';

import { listenerWidgetType } from '../content/listenerWidgets';
import { useListenerWidgetsStore } from '../stores/listenerWidgetsStore';
import { useSettingsModalStore } from '../stores/settingsModalStore';

export function MikseriSidebarWidget() {
  const instance = useListenerWidgetsStore((state) =>
    state.instances.find((item) => item.typeId === 'mikseri'),
  );
  const openSettings = useSettingsModalStore((state) => state.open);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  useEffect(() => {
    setLoadedId(null);
  }, [instance?.id]);

  if (!instance) {
    return null;
  }

  const src = listenerWidgetType('mikseri')?.toEmbedUrl(instance.input);

  return (
    <section
      aria-label="Mikseri.net playlist"
      className="border-border bg-background-secondary mx-1 flex flex-col gap-2 rounded-md border p-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold">Mikseri.net</p>
          <p className="text-foreground-secondary truncate text-[11px]">
            {instance.label}
          </p>
        </div>
        <Button
          size="icon-sm"
          variant="text"
          aria-label="Manage Mikseri widgets"
          onClick={() => openSettings('plugin-store', 'listen')}
        >
          <ExternalLinkIcon size={13} aria-hidden />
        </Button>
      </div>
      {loadedId === instance.id && src ? (
        <iframe
          title={instance.label}
          src={src}
          width="100%"
          height="190"
          className="border-0"
          allow="autoplay"
        />
      ) : (
        <Button
          size="sm"
          variant="secondary"
          disabled={!src}
          onClick={() => setLoadedId(instance.id)}
        >
          <PlayIcon size={13} aria-hidden />
          Load player
        </Button>
      )}
    </section>
  );
}
