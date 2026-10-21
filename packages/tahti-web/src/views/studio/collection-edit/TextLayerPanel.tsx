import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
      toast.error('Add some text or pick "None" as the effect.');
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
    toast.success('Text layer saved.');
  };

  return (
    <StudioPanel
      title="Text layer"
      description="A styled headline shown on the public page of this collection."
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
