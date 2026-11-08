import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
import { Button } from '@tahti-player/ui';

import {
  fetchCollectionTextLayer,
  saveCollectionTextLayer,
} from '../../../api/collection-text-layer';
import {
  ChannelTextOverlayEditor,
  type TextOverlayDraft,
} from '../../../components/ChannelTextOverlayEditor';
import { ChannelTextOverlayView } from '../../../components/ChannelTextOverlayView';
import { StudioPanel } from '../../../components/StudioPanel';

export function TextLayerPanel({ slug }: { slug: string }) {
  const { t } = useTranslation('web');
  const [draft, setDraft] = useState<TextOverlayDraft | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchCollectionTextLayer(slug).then((res) => {
      if (cancelled) {
        return;
      }
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setDraft({
        mode: res.data.textLayerMode,
        text: res.data.textLayerText,
        align: res.data.textLayerAlign,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!draft) {
    return null;
  }

  const save = async () => {
    if (draft.mode !== 'NONE' && draft.text.trim().length === 0) {
      toast.error(i18n.t('web:toasts.addTextOrNoneEffect'));
      return;
    }
    setSaving(true);
    const res = await saveCollectionTextLayer(slug, {
      textLayerMode: draft.mode,
      textLayerText: draft.text,
      textLayerAlign: draft.align,
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(i18n.t('web:toasts.textLayerSaved'));
  };

  return (
    <StudioPanel
      title={t('textLayerPanel.textLayer')}
      description={t('textLayerPanel.aStyledHeadlineShownOn')}
      action={
        <Button size="sm" onClick={() => void save()} disabled={saving}>
          {saving ? 'Saving…' : 'Save text layer'}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <ChannelTextOverlayEditor value={draft} onChange={setDraft} />
        <ChannelTextOverlayView
          mode={draft.mode}
          text={draft.text}
          align={draft.align}
          size="sm"
        />
      </div>
    </StudioPanel>
  );
}
