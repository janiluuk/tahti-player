import { PlusIcon } from 'lucide-react';

import { Button, Dialog, Input, Select, Textarea } from '@tahti-player/ui';

import {
  type AdminAddonRegisterInput,
  type AdminAddonScope,
} from '../../../api/admin';
import { ImageUploadField } from '../../../components/ImageUploadField';
import { SCOPES } from './shared';

export function RegisterDialog({
  isOpen,
  draft,
  pending,
  error,
  onChange,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  draft: AdminAddonRegisterInput;
  pending: boolean;
  error: string | null;
  onChange: (next: AdminAddonRegisterInput) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Dialog.Root isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <Dialog.Title>Register a new add-on</Dialog.Title>
      <Dialog.Description>
        Creates a draft add-on. It stays invisible everywhere until a bundle
        version is published and approved (not built in this UI yet — ask an
        engineer to publish the first version).
      </Dialog.Description>
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Slug"
            value={draft.slug}
            placeholder="live-status"
            onChange={(event) =>
              onChange({ ...draft, slug: event.target.value })
            }
            description="Lowercase letters, numbers, and hyphens."
          />
          <Select
            label="Add-on type"
            value={draft.scope}
            onValueChange={(value) =>
              onChange({ ...draft, scope: value as AdminAddonScope })
            }
            options={SCOPES.map((scope) => ({
              id: scope.id,
              label: scope.label,
            }))}
          />
        </div>
        <Input
          label="Name"
          value={draft.name}
          placeholder="Live status"
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
        />
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-foreground font-semibold">Description</span>
          <Textarea
            value={draft.description}
            rows={3}
            placeholder="What does this add-on show or do?"
            onChange={(event) =>
              onChange({ ...draft, description: event.target.value })
            }
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Author"
            value={draft.authorName}
            placeholder="Tahti"
            onChange={(event) =>
              onChange({ ...draft, authorName: event.target.value })
            }
          />
          <ImageUploadField
            label="Add-on cover"
            description="JPEG, PNG, WebP, or GIF"
            value={draft.iconUrl ?? ''}
            onChange={(iconUrl) => onChange({ ...draft, iconUrl })}
          />
        </div>
        <Input
          label="Parameters / categories"
          value={draft.categories.join(', ')}
          placeholder="stats, social, events"
          description="Comma-separated categories used to filter and describe the add-on."
          onChange={(event) =>
            onChange({
              ...draft,
              categories: event.target.value
                .split(',')
                .map((category) => category.trim())
                .filter(Boolean),
            })
          }
        />
        {error ? (
          <p className="text-accent-red text-sm" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <Dialog.Actions>
        <Dialog.Close>Cancel</Dialog.Close>
        <Button
          type="button"
          disabled={
            pending ||
            !draft.slug.trim() ||
            !draft.name.trim() ||
            !draft.description.trim() ||
            !draft.authorName.trim() ||
            draft.categories.length === 0
          }
          onClick={onSave}
        >
          <PlusIcon size={15} aria-hidden className="mr-1.5" />
          Register add-on
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
