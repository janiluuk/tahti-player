import { Link } from '@tanstack/react-router';
import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  InlineError,
  Input,
  Textarea,
  ViewShell,
} from '@tahti-player/ui';

import { registerVenue } from '../api/client';
import { ImageUploadField } from '../components/ImageUploadField';
import { PageBackLink } from '../components/PageBackLink';
import { useAuthStore } from '../stores/authStore';

export function VenueRegisterView() {
  const { t } = useTranslation('web');
  const user = useAuthStore((s) => s.user);
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [countryCode, setCountryCode] = useState('FI');
  const [capacity, setCapacity] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [pageUrl, setPageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [doneSlug, setDoneSlug] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!user) {
    return (
      <ViewShell
        title={t('venueRegister.registerAVenue')}
        classes={{ root: 'px-0 pt-0 mx-auto max-w-lg' }}
      >
        <Link
          to="/login"
          className="text-sm underline-offset-2 hover:underline"
        >
          Log in →
        </Link>
      </ViewShell>
    );
  }

  if (doneSlug) {
    return (
      <ViewShell
        title={t('venueRegister.submitted')}
        classes={{ root: 'px-0 pt-0 mx-auto max-w-lg' }}
      >
        <p className="text-foreground-secondary text-sm">
          <code>{doneSlug}</code> is pending board verification before it
          appears in the public directory. You can edit it and book shows there
          from My venues meanwhile.
        </p>
        <Link
          to="/venues/mine"
          className="text-sm font-medium underline-offset-2 hover:underline"
        >
          {t('venueRegister.goToMyVenues')}
        </Link>
        <PageBackLink
          to="/discover"
          search={{ tab: 'venues' }}
          label={t('venueRegister.allVenues')}
        />
      </ViewShell>
    );
  }

  return (
    <ViewShell
      title={t('venueRegister.registerAVenue')}
      classes={{ root: 'px-0 pt-0 mx-auto max-w-lg' }}
    >
      <PageBackLink
        to="/discover"
        search={{ tab: 'venues' }}
        label={t('venueRegister.allVenues')}
      />

      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setPending(true);
          setError(null);
          void registerVenue({
            slug: slug.trim(),
            name: name.trim(),
            address: address.trim(),
            city: city.trim(),
            countryCode: countryCode.trim() || 'FI',
            capacity: capacity ? Number(capacity) : undefined,
            description: description.trim() || undefined,
            imageUrl: imageUrl.trim() || undefined,
            coverUrl: coverUrl.trim() || undefined,
            pageUrl: pageUrl.trim() || undefined,
          }).then((res) => {
            setPending(false);
            if (!res.ok) {
              setError(res.error);
              return;
            }
            setDoneSlug(res.slug);
          });
        }}
      >
        <Input
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          label={t('venueRegister.urlSlug')}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="kulttuuritalo"
          required
          minLength={2}
          maxLength={64}
        />
        <Input
          label={t('venueRegister.venueName')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={120}
        />
        <Input
          autoComplete="off"
          label={t('venueRegister.streetAddress')}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          maxLength={200}
        />
        <Input
          autoComplete="off"
          label={t('venueRegister.city')}
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
          maxLength={80}
        />
        <Input
          label={t('venueRegister.countryCode')}
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
          maxLength={2}
        />
        <Input
          label={t('venueRegister.capacityOptional')}
          variant="number"
          min={1}
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
        />
        <Textarea
          submitOnModEnter
          label={t('venueRegister.descriptionOptional')}
          tone="secondary"
          className="min-h-[6rem] text-sm"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={4}
        />
        <ImageUploadField
          label={t('venueRegister.venueImage')}
          description={t('venueRegister.jpegPngWebpOrGif')}
          value={imageUrl}
          onChange={setImageUrl}
        />
        <ImageUploadField
          label={t('venueRegister.coverArt')}
          description={t('venueRegister.jpegPngWebpOrGif')}
          value={coverUrl}
          onChange={setCoverUrl}
        />
        <Input
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          label={t('venueRegister.venueWebsiteOptional')}
          value={pageUrl}
          onChange={(e) => setPageUrl(e.target.value)}
          placeholder="https://…"
        />
        <Button
          type="submit"
          disabled={
            pending ||
            !slug.trim() ||
            !name.trim() ||
            !address.trim() ||
            !city.trim()
          }
        >
          {pending ? 'Submitting…' : 'Submit for review'}
        </Button>
        {error && <InlineError>{error}</InlineError>}
      </form>
    </ViewShell>
  );
}
