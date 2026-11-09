import { useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation, type TFunction } from '@tahti-player/i18n';
import {
  Button,
  FilePicker,
  ImageReveal,
  SegmentedControl,
} from '@tahti-player/ui';

import {
  removeProfileLogo,
  setProfileLogoPlacement,
  uploadProfileLogo,
} from '../../../api/profile-logo';
import type { LogoPlacement } from '../../../api/studio-extras/profile';
import { StudioPanel } from '../../../components/StudioPanel';

function placements(t: TFunction<'web'>) {
  return [
    { id: 'AVATAR', label: t('profileLogoSectionMore.onAvatar') },
    { id: 'COVER', label: t('profileLogoSectionMore.onCover') },
    { id: 'BOTH', label: t('profileLogoSectionMore.both') },
  ] as const;
}

export function ProfileLogoSection({
  logoUrl,
  logoPlacement,
  onChange,
}: {
  logoUrl: string | null;
  logoPlacement: LogoPlacement | null;
  onChange: (next: {
    logoUrl: string | null;
    logoPlacement: LogoPlacement | null;
  }) => void;
}) {
  const { t } = useTranslation('web');
  const [busy, setBusy] = useState(false);

  const upload = async (files: readonly File[]) => {
    const file = files[0];
    if (!file) {
      return;
    }
    setBusy(true);
    const result = await uploadProfileLogo(file);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onChange({
      logoUrl: result.data.logoUrl,
      logoPlacement: logoPlacement ?? 'AVATAR',
    });
    toast.success(i18n.t('web:toasts.logoSaved'));
  };

  const place = async (next: LogoPlacement) => {
    setBusy(true);
    const result = await setProfileLogoPlacement(next);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onChange({ logoUrl, logoPlacement: next });
  };

  const remove = async () => {
    setBusy(true);
    const result = await removeProfileLogo();
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onChange({ logoUrl: null, logoPlacement });
  };

  return (
    <StudioPanel
      title={t('profileLogoSection.logo')}
      description={t('profileLogoSection.aTransparentLogoDrawnOver')}
    >
      <div className="flex flex-col gap-3">
        {logoUrl ? (
          <div className="flex flex-col gap-3" data-testid="profile-logo">
            <ImageReveal
              src={logoUrl}
              alt="Current logo"
              className="bg-background-secondary size-24 rounded-lg object-contain p-2"
            />
            <SegmentedControl
              aria-label={t('profileLogoSection.logoPlacement')}
              options={placements(t)}
              value={logoPlacement ?? 'AVATAR'}
              onChange={(next) => void place(next)}
              className="w-fit"
            />
            <Button
              variant="secondary"
              size="sm"
              className="self-start"
              disabled={busy}
              onClick={() => void remove()}
            >
              {t('profileLogoSection.removeLogo')}
            </Button>
          </div>
        ) : null}
        <FilePicker
          labels={{
            title: logoUrl ? 'Replace logo' : 'Add a logo',
            description: 'PNG or WebP with a transparent background',
            browse: busy ? 'Uploading…' : 'Choose image',
          }}
          accept="image/png,image/webp"
          disabled={busy}
          onFiles={(files) => void upload(files)}
        />
      </div>
    </StudioPanel>
  );
}
