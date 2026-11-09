import { useId, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, InlineError, Input, Textarea } from '@tahti-player/ui';

import {
  patchVenue,
  type MyVenue,
  type PatchVenueInput,
} from '../../api/venues-manage';

const DESCRIPTION_MAX = 2000;

/** Edit the details a venue shows in the directory (PATCH /api/v1/venues/:slug). */
export function VenueDetailsForm({
  venue,
  onSaved,
  onCancel,
}: {
  venue: MyVenue;
  onSaved: (venue: MyVenue) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation('web');
  const descriptionId = useId();
  const [name, setName] = useState(venue.name);
  const [address, setAddress] = useState(venue.address);
  const [city, setCity] = useState(venue.city);
  const [capacity, setCapacity] = useState(
    venue.capacity != null ? String(venue.capacity) : '',
  );
  const [description, setDescription] = useState(venue.description ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const capacityValue = capacity.trim() ? Number(capacity) : null;
    if (
      capacityValue !== null &&
      (!Number.isInteger(capacityValue) || capacityValue < 1)
    ) {
      setError('Capacity must be a whole number of people.');
      return;
    }
    if (!name.trim() || !address.trim() || !city.trim()) {
      setError('Name, address and city are required.');
      return;
    }
    const patch: PatchVenueInput = {
      name: name.trim(),
      address: address.trim(),
      city: city.trim(),
      capacity: capacityValue,
      description: description.trim() || null,
    };
    setBusy(true);
    setError(null);
    void patchVenue(venue.slug, patch).then((result) => {
      setBusy(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSaved(result.data);
    });
  };

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <Input
        autoComplete="off"
        label={t('venueDetails.name')}
        value={name}
        maxLength={120}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        autoComplete="off"
        label={t('venueDetails.streetAddress')}
        value={address}
        maxLength={200}
        onChange={(e) => setAddress(e.target.value)}
      />
      <Input
        autoComplete="off"
        label={t('venueDetails.city')}
        value={city}
        maxLength={80}
        onChange={(e) => setCity(e.target.value)}
      />
      <Input
        label={t('venueDetails.capacity')}
        inputMode="numeric"
        value={capacity}
        onChange={(e) => setCapacity(e.target.value)}
      />
      <Textarea
        submitOnModEnter
        id={descriptionId}
        label={t('venueDetails.description')}
        rows={4}
        value={description}
        maxLength={DESCRIPTION_MAX}
        onChange={(e) => setDescription(e.target.value)}
      />
      {error ? <InlineError>{error}</InlineError> : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy}>
          {busy
            ? t('venueDetailsFormStates.saving')
            : t('venueDetailsFormStates.saveDetails')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={onCancel}
        >
          {t('venueDetails.cancel')}
        </Button>
      </div>
    </form>
  );
}
