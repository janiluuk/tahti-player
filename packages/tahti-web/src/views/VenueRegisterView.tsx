import { Link } from '@tanstack/react-router';
import { useState } from 'react';

import { Button, Input, Textarea, ViewShell } from '@tahti-player/ui';

import { registerVenue } from '../api/client';
import { ImageUploadField } from '../components/ImageUploadField';
import { useAuthStore } from '../stores/authStore';

export function VenueRegisterView() {
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
        title="Register a venue"
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
        title="Submitted"
        classes={{ root: 'px-0 pt-0 mx-auto max-w-lg' }}
      >
        <p className="text-foreground-secondary text-sm">
          <code>{doneSlug}</code> is pending board verification before it
          appears in the public directory.
        </p>
        <Link
          to="/discover"
          search={{ tab: 'venues' }}
          className="text-sm underline-offset-2 hover:underline"
        >
          ← Back to venues
        </Link>
      </ViewShell>
    );
  }

  return (
    <ViewShell
      title="Register a venue"
      classes={{ root: 'px-0 pt-0 mx-auto max-w-lg' }}
    >
      <Link
        to="/discover"
        search={{ tab: 'venues' }}
        className="text-foreground-secondary mb-2 block w-fit text-xs hover:underline"
      >
        ← Venues
      </Link>

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
          label="URL slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="kulttuuritalo"
          required
          minLength={2}
          maxLength={64}
        />
        <Input
          label="Venue name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={120}
        />
        <Input
          label="Street address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          maxLength={200}
        />
        <Input
          label="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
          maxLength={80}
        />
        <Input
          label="Country code"
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
          maxLength={2}
        />
        <Input
          label="Capacity (optional)"
          variant="number"
          min={1}
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
        />
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-foreground-secondary text-xs tracking-wide uppercase">
            Description (optional)
          </span>
          <Textarea
            tone="secondary"
            className="min-h-[6rem] text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={4}
          />
        </label>
        <ImageUploadField
          label="Venue image"
          description="JPEG, PNG, WebP, or GIF"
          value={imageUrl}
          onChange={setImageUrl}
        />
        <ImageUploadField
          label="Cover art"
          description="JPEG, PNG, WebP, or GIF"
          value={coverUrl}
          onChange={setCoverUrl}
        />
        <Input
          label="Venue website (optional)"
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
        {error && <p className="text-accent-red-strong text-sm">{error}</p>}
      </form>
    </ViewShell>
  );
}
