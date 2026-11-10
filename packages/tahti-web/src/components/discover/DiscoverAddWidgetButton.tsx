import { Blocks, Plus } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Popover } from '@tahti-player/ui';

import type { DiscoverWidgetId } from '../../stores/discoverStore';
import { WIDGET_LABEL_KEYS, WIDGET_MENU } from './widgetMeta';

export function DiscoverAddWidgetButton({
  availableToAdd,
  onAdd,
}: {
  availableToAdd: DiscoverWidgetId[];
  onAdd: (id: DiscoverWidgetId) => void;
}) {
  const { t } = useTranslation('web');
  if (availableToAdd.length === 0) {
    return null;
  }

  return (
    <Popover
      anchor="bottom end"
      tooltip={{ content: t('discover.addWidget'), side: 'top' }}
      trigger={
        <Button
          size="icon"
          variant="secondary"
          aria-label={t('discover.addWidget')}
          data-testid="discover-add-widget"
          className="md:w-auto md:gap-2 md:px-4"
        >
          <Plus size={17} aria-hidden />
          <Blocks size={15} aria-hidden className="md:hidden" />
          <span aria-hidden className="hidden md:inline">
            {t('listen.addWidget')}
          </span>
        </Button>
      }
      panelClassName="w-72 px-0 py-1"
    >
      <Popover.Menu>
        {availableToAdd.map((id) => {
          const { icon: Icon, description } = WIDGET_MENU[id];
          return (
            <Popover.Item
              key={id}
              closeOnClick
              onClick={() => onAdd(id)}
              icon={<Icon size={14} aria-hidden className="opacity-70" />}
              className="rounded-sm"
            >
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-foreground text-xs font-medium">
                  {t(WIDGET_LABEL_KEYS[id])}
                </span>
                <span className="text-foreground-secondary text-[11px] leading-snug">
                  {description}
                </span>
              </span>
            </Popover.Item>
          );
        })}
      </Popover.Menu>
    </Popover>
  );
}
