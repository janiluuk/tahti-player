import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Dialog,
  InlineError,
  Input,
  SaveButton,
  Toggle,
} from '@tahti-player/ui';

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
import {
  RotationMirrorToggle,
  useRotationMirror,
} from './RotationMirrorToggle';

export type MulticastConfiguring = {
  provider: MulticastProviderId;
  existing: RtmpTarget | null;
};

/** Add or edit one multistream RTMP destination — the real configuration
 * dialog (address/port split for custom RTMP, ingest-server hint for
 * known platforms, an enabled toggle, save/error state). Shared between
 * Settings → Add-ons → Multistream and Studio → Broadcast's "Add
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
  const { t } = useTranslation('web');
  const { provider, existing } = configuring;
  const isCustom = provider === 'CUSTOM';
  const [label, setLabel] = useState(existing?.label ?? '');
  const [address, setAddress] = useState('');
  const [port, setPort] = useState('1935');
  const [streamKey, setStreamKey] = useState('');
  const [enabled, setEnabled] = useState(existing?.enabled ?? true);
  const mirror = useRotationMirror(existing, 'me');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    setError(null);
    if (existing) {
      // Stream key and RTMP address are fixed at creation here, so only
      // label/enabled/alwaysMirror are resent.
      setSaving(true);
      const mirrorField = mirror.field();
      void patchRtmpTarget(existing.id, {
        label: label.trim() || undefined,
        enabled,
        ...mirrorField,
      }).then((result) => {
        setSaving(false);
        if (!result.ok) {
          setError(result.error);
          if ('alwaysMirror' in mirrorField) {
            mirror.refuse();
          }
          return;
        }
        onSaved();
      });
      return;
    }
    if (!streamKey.trim() || (isCustom && !address.trim())) {
      setError(
        isCustom
          ? t('multicastConfigureDialogStates.rtmpAddressAndStreamKey')
          : t('multicastConfigureDialogStates.streamKeyIsRequired'),
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
      ...mirror.field(),
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
          ? t('multicastConfigureDialogStates.updateTheDestinationLabelAnd')
          : t('multicastConfigureDialogStates.enterTheCredentialThisPlatform')}
      </Dialog.Description>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <div className="mt-4 flex flex-col gap-3">
          <Input
            label={t('multicastConfigure.labelOptional')}
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
                    inputMode="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    label={t('multicastConfigure.rtmpAddress')}
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="rtmp://stream.example.com/live"
                  />
                  <Input
                    label={t('multicastConfigure.port')}
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
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                label={
                  isCustom
                    ? t('multicastConfigureDialogStates.streamKey')
                    : t('multicastConfigureDialogStates.streamKeyApiKey')
                }
                value={streamKey}
                onChange={(event) => setStreamKey(event.target.value)}
                placeholder={
                  isCustom
                    ? t('multicastConfigureDialogStates.pasteStreamKey')
                    : t(
                        'multicastConfigureDialogStates.pastePlatformCredential',
                      )
                }
              />
            </>
          )}
          <div className="flex items-center justify-between gap-3 text-sm">
            <span>{t('multicastConfigure.enabledMirrorTheLiveStream')}</span>
            <Toggle
              label={t('multicastConfigure.enabledMirrorTheLiveStream')}
              checked={enabled}
              onChange={setEnabled}
            />
          </div>
          {mirror.visible ? (
            <RotationMirrorToggle
              checked={mirror.checked}
              onChange={mirror.setChecked}
              disabled={saving}
            />
          ) : null}
          {error ? <InlineError>{error}</InlineError> : null}
        </div>
        <Dialog.Actions>
          <Dialog.Close>{t('multicastConfigure.cancel')}</Dialog.Close>
          <SaveButton
            saving={saving}
            label={t('multicastConfigure.saveDestination')}
            type="submit"
          />
        </Dialog.Actions>
      </form>
    </Dialog.Root>
  );
}
