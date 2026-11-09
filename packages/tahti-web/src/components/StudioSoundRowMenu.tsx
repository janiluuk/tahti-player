import { useNavigate } from '@tanstack/react-router';
import {
  AudioLinesIcon,
  MoreHorizontalIcon,
  PinIcon,
  PinOffIcon,
  SparklesIcon,
  Trash2Icon,
  WrenchIcon,
} from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Tooltip, TrackContextMenu } from '@tahti-player/ui';

import type { StudioSound } from '../api/studio-types';
import { isPinned } from '../lib/pinnedTracks';
import { useMasteringFeatureStore } from '../plugins/mastering/store';

type StudioSoundRowMenuProps = {
  item: StudioSound;
  busy: boolean;
  hasEmbed: boolean;
  onTogglePin: () => void;
  onDelete: () => void;
};

/** Storybook TrackContextMenu for Studio → Sounds row overflow actions. */
export function StudioSoundRowMenu({
  item,
  busy,
  hasEmbed,
  onTogglePin,
  onDelete,
}: StudioSoundRowMenuProps) {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const masteringEnabled = useMasteringFeatureStore((state) => state.enabled);
  const pinned = isPinned(item);

  return (
    <TrackContextMenu>
      <Tooltip content={t('studioSoundRowMenu.more')} side="top">
        <TrackContextMenu.Trigger>
          <Button
            size="icon-sm"
            variant="text"
            aria-label={t('studioSoundRowMenuLabels.moreActionsForTitle', {
              title: item.title,
            })}
          >
            <MoreHorizontalIcon size={16} aria-hidden />
          </Button>
        </TrackContextMenu.Trigger>
      </Tooltip>
      <TrackContextMenu.Content>
        <TrackContextMenu.Header title={item.title} subtitle={item.status} />
        <TrackContextMenu.Action
          icon={pinned ? <PinOffIcon size={16} /> : <PinIcon size={16} />}
          onClick={() => {
            if (busy) {
              return;
            }
            onTogglePin();
          }}
        >
          {pinned ? 'Unpin from page' : 'Pin to page'}
        </TrackContextMenu.Action>
        {!hasEmbed ? (
          <TrackContextMenu.Submenu>
            <TrackContextMenu.Submenu.Trigger icon={<WrenchIcon size={16} />}>
              {t('studioSoundRowMenu.audioTools')}
            </TrackContextMenu.Submenu.Trigger>
            <TrackContextMenu.Submenu.Content>
              <TrackContextMenu.Action
                icon={<AudioLinesIcon size={16} />}
                onClick={() =>
                  void navigate({
                    to: '/studio/sounds/$id/editor',
                    params: { id: item.id },
                  })
                }
              >
                {t('studioSoundRowMenu.openInProEditor')}
              </TrackContextMenu.Action>
              {masteringEnabled ? (
                <TrackContextMenu.Action
                  icon={<SparklesIcon size={16} />}
                  onClick={() =>
                    void navigate({
                      to: '/studio/mastering/$id',
                      params: { id: item.id },
                    })
                  }
                >
                  {t('studioSoundRowMenu.referenceMastering')}
                </TrackContextMenu.Action>
              ) : null}
            </TrackContextMenu.Submenu.Content>
          </TrackContextMenu.Submenu>
        ) : null}
        <TrackContextMenu.Action
          icon={<Trash2Icon className="text-accent-red" size={16} />}
          onClick={onDelete}
        >
          {t('studioSoundRowMenu.delete')}
        </TrackContextMenu.Action>
      </TrackContextMenu.Content>
    </TrackContextMenu>
  );
}
