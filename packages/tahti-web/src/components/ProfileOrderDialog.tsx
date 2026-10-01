import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, Dialog, SaveButton } from '@tahti-player/ui';

import { PageLoading } from './PageStates';

export type OrderItem = { id: string; title: string };

export function ProfileOrderDialog({
  isOpen,
  title,
  description,
  empty,
  load,
  save,
  onClose,
}: {
  isOpen: boolean;
  title: string;
  description: string;
  empty: string;
  load: () => Promise<OrderItem[]>;
  save: (ids: string[]) => Promise<{ ok: true } | { ok: false; error: string }>;
  onClose: () => void;
}) {
  const [items, setItems] = useState<OrderItem[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setItems(null);
      return;
    }
    let cancelled = false;
    void load().then((loaded) => {
      if (!cancelled) {
        setItems(loaded);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, load]);

  const move = (index: number, delta: -1 | 1) => {
    setItems((current) => {
      if (!current) {
        return current;
      }
      const target = index + delta;
      if (target < 0 || target >= current.length) {
        return current;
      }
      const next = [...current];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  };

  const submit = async () => {
    if (!items) {
      return;
    }
    setSaving(true);
    const result = await save(items.map((item) => item.id));
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success('Order saved.');
    onClose();
  };

  return (
    <Dialog.Root isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <Dialog.Title>{title}</Dialog.Title>
      <Dialog.Description>{description}</Dialog.Description>
      <div className="max-h-96 overflow-y-auto py-4">
        {items === null ? (
          <PageLoading label="Loading…" />
        ) : items.length === 0 ? (
          <p className="text-foreground-secondary text-sm">{empty}</p>
        ) : (
          <ol className="flex flex-col gap-1.5" aria-label={title}>
            {items.map((item, index) => (
              <li
                key={item.id}
                className="border-border flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
              >
                <span className="text-foreground-secondary w-6 text-xs tabular-nums">
                  {index + 1}.
                </span>
                <span className="min-w-0 flex-1 truncate">{item.title}</span>
                <Button
                  variant="text"
                  size="sm"
                  aria-label={`Move ${item.title} up`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUpIcon size={14} aria-hidden />
                </Button>
                <Button
                  variant="text"
                  size="sm"
                  aria-label={`Move ${item.title} down`}
                  disabled={index === items.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDownIcon size={14} aria-hidden />
                </Button>
              </li>
            ))}
          </ol>
        )}
      </div>
      <Dialog.Actions>
        <Dialog.Close>Cancel</Dialog.Close>
        <SaveButton
          label="Save order"
          saving={saving}
          disabled={!items || items.length === 0}
          onClick={() => void submit()}
        />
      </Dialog.Actions>
    </Dialog.Root>
  );
}
