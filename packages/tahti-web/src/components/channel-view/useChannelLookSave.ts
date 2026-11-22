import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';

import {
  patchChannelVisual,
  saveChannelLookExtras,
} from '../../api/channel-design';
import { isSafeChannelLinkUrl } from '../../lib/safeHref';
import type { ChannelDesignerHandle } from '../ChannelDesigner';
import type { useChannelLinksDraft } from './useChannelLinksDraft';
import type { usePresetLookDraft } from './usePresetLookDraft';

type ChannelLookSaveOptions = {
  slug: string;
  layoutDirty: boolean;
  saveLayout: () => void;
  revertLayout: () => void;
  linksDraft: ReturnType<typeof useChannelLinksDraft>;
  presetDraft: ReturnType<typeof usePresetLookDraft>;
  onLookSaved: () => void;
  onLinksSaved: () => void;
};

/** One Save for the channel editor: layout, look (designer or a staged
 * preset) and links together, plus the matching Revert. */
export function useChannelLookSave({
  slug,
  layoutDirty,
  saveLayout,
  revertLayout,
  linksDraft,
  presetDraft,
  onLookSaved,
  onLinksSaved,
}: ChannelLookSaveOptions) {
  const { t } = useTranslation('web');
  const designerRef = useRef<ChannelDesignerHandle>(null);
  const [lookDirty, setLookDirty] = useState(false);
  const [savingLook, setSavingLook] = useState(false);
  const [lookBusy, setLookBusy] = useState(false);

  const saveAll = async () => {
    if (layoutDirty) {
      saveLayout();
    }
    setSavingLook(true);
    try {
      if (lookDirty && designerRef.current) {
        await designerRef.current.save();
        presetDraft.clearPending();
      } else if (await presetDraft.saveDirectly()) {
        setLookDirty(false);
        onLookSaved();
      }
      if (linksDraft.dirty) {
        const invalid = linksDraft.links.find(
          (link) => link.url.trim() && !isSafeChannelLinkUrl(link.url),
        );
        if (invalid) {
          toast.error(t('toasts.channelLinksInvalid'));
          return;
        }
        const result = await patchChannelVisual({
          channelLinks: linksDraft.links,
        });
        if (result.ok) {
          saveChannelLookExtras(slug, { channelLinks: linksDraft.links });
          linksDraft.markSaved();
          onLinksSaved();
        } else {
          toast.error(result.error);
        }
      }
      presetDraft.setNote(null);
    } catch {
      toast.error(t('toasts.channelLookSaveFailed'));
    } finally {
      setSavingLook(false);
    }
  };

  const revertAll = () => {
    if (savingLook || designerRef.current?.busy) {
      return;
    }
    designerRef.current?.revert();
    revertLayout();
    linksDraft.revert();
    presetDraft.clearPending();
    presetDraft.setNote(null);
    setLookDirty(false);
  };

  return {
    designerRef,
    dirty: layoutDirty || lookDirty || linksDraft.dirty,
    saving: savingLook || lookBusy,
    setLookDirty,
    setLookBusy,
    saveAll,
    revertAll,
  };
}
