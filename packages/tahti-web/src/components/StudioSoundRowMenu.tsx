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
  const navigate = useNavigate();
  const masteringEnabled = useMasteringFeatureStore((state) => state.enabled);
  const pinned = isPinned(item);

  return (
    <TrackContextMenu>
      <TrackContextMenu.Trigger>
        <Tooltip content="More" side="top">
          <Button
            size="icon-sm"
            variant="text"
            aria-label={`More actions for ${item.title}`}
          >
            <MoreHorizontalIcon size={16} aria-hidden />
          </Button>
        </Tooltip>
      </TrackContextMenu.Trigger>
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
              Audio tools
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
                Open in Pro Editor
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
                  Reference mastering
                </TrackContextMenu.Action>
              ) : null}
            </TrackContextMenu.Submenu.Content>
          </TrackContextMenu.Submenu>
        ) : null}
        <TrackContextMenu.Action
          icon={<Trash2Icon size={16} />}
          onClick={onDelete}
        >
          Delete
        </TrackContextMenu.Action>
      </TrackContextMenu.Content>
    </TrackContextMenu>
  );
}
