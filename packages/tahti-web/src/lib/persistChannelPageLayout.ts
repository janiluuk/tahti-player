import { toast } from 'sonner';

import { i18n } from '@tahti-player/i18n';

import { patchChannelVisual } from '../api/channel-design/patch';
import {
  normalizeLayout,
  saveChannelPageLayout,
  type ChannelPageItem,
} from './channelPageLayout';

/** Saves the owner's channel page layout: locally for this browser and on
 * the channel (`pageLayout`) so visitors and other devices get it. */
export async function persistChannelPageLayout(
  slug: string,
  items: ChannelPageItem[],
): Promise<boolean> {
  const layout = normalizeLayout(items);
  saveChannelPageLayout(slug, layout);
  const result = await patchChannelVisual({ pageLayout: layout });
  if (!result.ok) {
    toast.error(i18n.t('web:toasts.channelLayoutSaveFailed'));
    return false;
  }
  return true;
}
