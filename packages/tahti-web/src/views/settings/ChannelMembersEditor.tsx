import { PencilIcon, Trash2Icon } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { Button, Input } from '@tahti-player/ui';

import type { ChannelMember } from '../../api/artist-settings';
import {
  addChannelMember,
  clearChannelMemberPicture,
  removeChannelMember,
  updateChannelMember,
  uploadChannelMemberPicture,
} from '../../api/channel-members';
import { setChannelMemberPictureFromUrl } from '../../api/image-from-url';
import { ImageUrlForm } from '../../components/ImageUrlForm';
import { RoundImageUploadButton } from '../../components/RoundImageUploadButton';
import { SettingsHint } from './SettingsFields';

function MemberForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: { name: string; role: string };
  submitLabel: string;
  onSubmit: (value: { name: string; role: string }) => Promise<boolean>;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [role, setRole] = useState(initial.role);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !role.trim()) {
      return;
    }
    setBusy(true);
    const saved = await onSubmit({ name: name.trim(), role: role.trim() });
    setBusy(false);
    if (saved && !onCancel) {
      setName('');
      setRole('');
    }
  };

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row sm:items-end"
      onSubmit={(event) => void submit(event)}
    >
      <div className="min-w-0 flex-1">
        <Input
          label="Name"
          value={name}
          maxLength={100}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="min-w-0 flex-1">
        <Input
          label="Role"
          placeholder="Vocals, production…"
          value={role}
          maxLength={100}
          onChange={(event) => setRole(event.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={busy || !name.trim() || !role.trim()}
        >
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button variant="text" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}

/** The lineup/credits shown on the public artist page: add people with a
 * role, rename or re-role them, and take them off. */
export function ChannelMembersEditor({
  members,
  onChange,
}: {
  members: ChannelMember[];
  onChange: (members: ChannelMember[]) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [fetchingPictureId, setFetchingPictureId] = useState<string | null>(
    null,
  );

  const add = async (value: { name: string; role: string }) => {
    const result = await addChannelMember(value);
    if (!result.ok) {
      toast.error(result.error);
      return false;
    }
    onChange([...members, result.data]);
    return true;
  };

  const save = async (id: string, value: { name: string; role: string }) => {
    const result = await updateChannelMember(id, value);
    if (!result.ok) {
      toast.error(result.error);
      return false;
    }
    onChange(
      members.map((member) => (member.id === id ? result.data : member)),
    );
    setEditingId(null);
    return true;
  };

  const pictureFromUrl = async (id: string, sourceUrl: string) => {
    setFetchingPictureId(id);
    const result = await setChannelMemberPictureFromUrl(id, sourceUrl);
    setFetchingPictureId(null);
    if (!result.ok) {
      toast.error(result.error);
      return false;
    }
    onChange(
      members.map((member) =>
        member.id === id ? { ...member, pictureUrl: result.url } : member,
      ),
    );
    return true;
  };

  const changePicture = async (id: string, url: string) => {
    if (url) {
      onChange(
        members.map((member) =>
          member.id === id ? { ...member, pictureUrl: url } : member,
        ),
      );
      return;
    }
    const result = await clearChannelMemberPicture(id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onChange(
      members.map((member) => (member.id === id ? result.data : member)),
    );
  };

  const remove = async (id: string) => {
    setRemovingId(id);
    const result = await removeChannelMember(id);
    setRemovingId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onChange(members.filter((member) => member.id !== id));
  };

  return (
    <div className="flex flex-col gap-3">
      {members.length === 0 ? (
        <SettingsHint>No members listed.</SettingsHint>
      ) : (
        <ul className="flex flex-col gap-2" data-testid="channel-members">
          {members.map((member) => (
            <li
              key={member.id}
              className="border-border rounded-md border px-3 py-2 text-sm"
            >
              {editingId === member.id ? (
                <div className="flex flex-col gap-3">
                  <MemberForm
                    initial={member}
                    submitLabel="Save"
                    onSubmit={(value) => save(member.id, value)}
                    onCancel={() => setEditingId(null)}
                  />
                  <ImageUrlForm
                    busy={fetchingPictureId === member.id}
                    onSubmit={(url) => pictureFromUrl(member.id, url)}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <RoundImageUploadButton
                    label={`Picture of ${member.name}`}
                    value={member.pictureUrl}
                    sizeClassName="size-10"
                    upload={(file) =>
                      uploadChannelMemberPicture(member.id, file)
                    }
                    onChange={(url) => void changePicture(member.id, url)}
                  />
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {member.name}
                  </span>
                  <span className="text-foreground-secondary truncate text-xs">
                    {member.role}
                  </span>
                  <Button
                    variant="text"
                    size="sm"
                    aria-label={`Edit ${member.name}`}
                    onClick={() => setEditingId(member.id)}
                  >
                    <PencilIcon size={14} aria-hidden />
                  </Button>
                  <Button
                    variant="text"
                    size="sm"
                    aria-label={`Remove ${member.name}`}
                    disabled={removingId === member.id}
                    onClick={() => void remove(member.id)}
                  >
                    <Trash2Icon size={14} aria-hidden />
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <MemberForm
        initial={{ name: '', role: '' }}
        submitLabel="Add person"
        onSubmit={add}
      />
    </div>
  );
}
