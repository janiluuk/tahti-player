import { Blocks, Plus } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Popover } from '@tahti-player/ui';

import type { DiscoverWidgetId } from '../../stores/discoverStore';
import { WIDGET_LABELS, WIDGET_MENU } from './widgetMeta';

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
        >
          <Plus size={17} aria-hidden />
          <Blocks size={15} aria-hidden />
        </Button>
      }
      panelClassName="w-72 px-1"
    >
      <Popover.Menu>
        {availableToAdd.map((id) => {
          const { icon: Icon, description } = WIDGET_MENU[id];
          return (
            <Popover.Item
              key={id}
              closeOnClick
              onClick={() => onAdd(id)}
              icon={<Icon size={16} aria-hidden />}
              className="rounded-md"
            >
              <span className="flex flex-col">
                <span className="font-semibold">{WIDGET_LABELS[id]}</span>
                <span className="text-xs opacity-80">{description}</span>
              </span>
            </Popover.Item>
          );
        })}
      </Popover.Menu>
    </Popover>
  );
}
