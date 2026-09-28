import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button, Dialog } from '@tahti-player/ui';

import { provisionChannel } from '../api/channel-provision';
import { useAuthStore } from '../stores/authStore';
import { useChannelSetupModalStore } from '../stores/channelSetupModalStore';
import { ChannelControlsWidget } from './ChannelControlsWidget';
import { ChannelDesigner } from './ChannelDesigner';

export function ChannelSetupDialog() {
  const isOpen = useChannelSetupModalStore((state) => state.isOpen);
  const close = useChannelSetupModalStore((state) => state.close);
  const user = useAuthStore((state) => state.user);
  const profileLoaded = useAuthStore((state) => state.profileLoaded);
  const refresh = useAuthStore((state) => state.refresh);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [designStep, setDesignStep] = useState(false);

  const createChannel = async () => {
    setBusy(true);
    setError(null);
    const result = await provisionChannel();
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }
    await refresh();
    setBusy(false);
    setDesignStep(true);
    toast.success('Channel created.');
  };

  if ((user?.channel || !profileLoaded) && !designStep) {
    return null;
  }

  if (designStep && user?.channel) {
    return (
      <Dialog.Root
        isOpen={isOpen}
        onClose={() => {
          setDesignStep(false);
          close();
        }}
        className="max-w-4xl"
      >
        <Dialog.Title>Design your channel</Dialog.Title>
        <Dialog.Description>
          Choose the look for your new channel. You can fine-tune it later from
          the public channel page.
        </Dialog.Description>
        <div className="mt-4 max-h-[65vh] overflow-auto">
          <ChannelControlsWidget
            sections={[
              {
                id: 'channel-design',
                title: 'Channel appearance',
                children: (
                  <ChannelDesigner
                    displayName={user.displayName}
                    username={user.username}
                    channelSlug={user.channel.slug}
                    avatarUrl={user.avatarUrl}
                    livePreview={false}
                  />
                ),
              },
            ]}
          />
        </div>
        <Dialog.Actions>
          <Button
            onClick={() => {
              setDesignStep(false);
              close();
            }}
          >
            Finish setup
          </Button>
        </Dialog.Actions>
      </Dialog.Root>
    );
  }

  return (
    <Dialog.Root isOpen={isOpen} onClose={close} className="max-w-lg">
      <Dialog.Title>Create your channel</Dialog.Title>
      <Dialog.Description>
        Create {user?.username ?? 'your-name'}.tahti.live to unlock
        broadcasting, uploads, and your public channel designer.
      </Dialog.Description>
      {error ? (
        <p className="text-accent-red mt-4 text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <Dialog.Actions>
        <Button variant="text" size="sm" onClick={close} disabled={busy}>
          Cancel
        </Button>
        <Button onClick={() => void createChannel()} disabled={busy || !user}>
          {!busy ? <PlusIcon size={14} aria-hidden className="mr-1.5" /> : null}
          {busy
            ? 'Creating…'
            : `Create ${user?.username ?? 'your-name'}.tahti.live`}
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
