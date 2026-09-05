import { useState } from 'react';

import { Dialog, Input, SaveButton, Toggle } from '@tahti-player/ui';

import {
  createRtmpTarget,
  patchRtmpTarget,
  type RtmpTarget,
} from '../api/broadcast';
import {
  multicastProviderLabel,
  multicastProviders,
  type MulticastProviderId,
} from '../plugins/multicast';

export type MulticastConfiguring = {
  provider: MulticastProviderId;
  existing: RtmpTarget | null;
};

/** Add or edit one multistream RTMP destination — the real configuration
 * dialog (address/port split for custom RTMP, ingest-server hint for
 * known platforms, an enabled toggle, save/error state). Shared between
 * Settings → Add-ons → Multistream and Studio → Go Live's "Add
 * destination" so both use the same form instead of a second, lesser one. */
export function MulticastConfigureDialog({
  configuring,
  onClose,
  onSaved,
}: {
  configuring: MulticastConfiguring;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { provider, existing } = configuring;
  const isCustom = provider === 'CUSTOM';
  const [label, setLabel] = useState(existing?.label ?? '');
  const [address, setAddress] = useState('');
  const [port, setPort] = useState('1935');
  const [streamKey, setStreamKey] = useState('');
  const [enabled, setEnabled] = useState(existing?.enabled ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    setError(null);
    if (existing) {
      // The API only lets an existing target's label/enabled state change
      // -- its stream key and RTMP address are fixed at creation, so there
      // is nothing else here to resend.
      setSaving(true);
      void patchRtmpTarget(existing.id, {
        label: label.trim() || undefined,
        enabled,
      }).then((result) => {
        setSaving(false);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        onSaved();
      });
      return;
    }
    if (!streamKey.trim() || (isCustom && !address.trim())) {
      setError(
        isCustom
          ? 'RTMP address and stream key are required.'
          : 'Stream key is required.',
      );
      return;
    }
    const rtmpUrl = isCustom
      ? `${address.trim().replace(/\/$/, '')}:${port.trim() || '1935'}`
      : undefined;
    setSaving(true);
    void createRtmpTarget({
      provider,
      streamKey: streamKey.trim(),
      label: label.trim() || undefined,
      rtmpUrl,
      enabled,
    }).then((result) => {
      setSaving(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSaved();
    });
  };

  return (
    <Dialog.Root
      isOpen
      onClose={() => !saving && onClose()}
      className="max-w-lg"
    >
      <Dialog.Title>Configure {multicastProviderLabel(provider)}</Dialog.Title>
      <Dialog.Description>
        {existing
          ? 'Update the destination label and whether it mirrors your live stream.'
          : 'Enter the credential this platform uses for live streaming. Custom RTMP also needs its server address and port.'}
      </Dialog.Description>
      <div className="mt-4 flex flex-col gap-3">
        <Input
          label="Label (optional)"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder={multicastProviderLabel(provider)}
        />
        {existing ? (
          <p className="text-foreground-secondary text-xs">
            {existing.rtmpUrl}
            {existing.keyLast4 ? ` · key ···${existing.keyLast4}` : ''}
          </p>
        ) : (
          <>
            {isCustom ? (
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
                <Input
                  label="RTMP address"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="rtmp://stream.example.com/live"
                />
                <Input
                  label="Port"
                  value={port}
                  onChange={(event) => setPort(event.target.value)}
                  placeholder="1935"
                  inputMode="numeric"
                />
              </div>
            ) : (
              <p className="text-foreground-secondary text-xs">
                Ingest server:{' '}
                {multicastProviders.find((item) => item.id === provider)
                  ?.rtmpUrlHint ?? 'the platform chooses the ingest server'}
              </p>
            )}
            <Input
              label={isCustom ? 'Stream key' : 'Stream key / API key'}
              value={streamKey}
              onChange={(event) => setStreamKey(event.target.value)}
              placeholder={
                isCustom ? 'Paste stream key' : 'Paste platform credential'
              }
            />
          </>
        )}
        <div className="flex items-center justify-between gap-3 text-sm">
          <span>Enabled — mirror the live stream here</span>
          <Toggle
            label="Enabled — mirror the live stream here"
            checked={enabled}
            onChange={setEnabled}
          />
        </div>
        {error ? (
          <p className="text-accent-red text-sm" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <Dialog.Actions>
        <Dialog.Close>Cancel</Dialog.Close>
        <SaveButton saving={saving} label="Save destination" onClick={save} />
      </Dialog.Actions>
    </Dialog.Root>
  );
}
