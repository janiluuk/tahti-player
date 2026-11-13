import { Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  Checkbox,
  Dialog,
  InlineError,
  Input,
  Select,
  Tabs,
} from '@tahti-player/ui';

import {
  fetchMeProfile,
  patchMeProfile,
} from '../../../api/studio-extras/profile';
import { fetchStudioCollections } from '../../../api/studio/studio-collections';
import { soundcloudSourceAdapter } from '../../../plugins/import-sources/oauth';
import {
  expandChoices,
  importOne,
  loadChoices,
  loadSocial,
  savedProfile,
  serviceReady,
  WIZARD_SERVICES,
  type ImportChoice,
  type WizardService,
} from './importWizardCatalog';

const SERVICE_NAME: Record<WizardService, string> = {
  soundcloud: 'SoundCloud',
  hearthis: 'hearthis.at',
  spotify: 'Spotify',
  mixcloud: 'Mixcloud',
};

const SOCIAL_KEY = {
  soundcloud: 'soundcloud',
  hearthis: 'hearthisAt',
  spotify: 'spotify',
  mixcloud: 'mixcloud',
} as const;

type Step = 'source' | 'account' | 'choose' | 'review' | 'progress';

export function ImportWizard({
  start,
  onClose,
}: {
  start: WizardService | 'pick' | null;
  onClose: () => void;
}) {
  const { t } = useTranslation('web');
  const [step, setStep] = useState<Step>('source');
  const [service, setService] = useState<WizardService | null>(null);
  const [choices, setChoices] = useState<ImportChoice[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConnect, setNeedsConnect] = useState(false);
  const [skippedAccount, setSkippedAccount] = useState(false);
  const [profileDraft, setProfileDraft] = useState('');
  const [collections, setCollections] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);

  const begin = async (next: WizardService) => {
    setService(next);
    setError(null);
    setSelected([]);
    setLoading(true);
    const social = await loadSocial();
    const ready = await serviceReady(next, social);
    setProfileDraft(savedProfile(next, social));
    if (!ready) {
      setSkippedAccount(false);
      setStep('account');
      setLoading(false);
      return;
    }
    setSkippedAccount(true);
    await showChoices(next, social);
  };

  const showChoices = async (
    next: WizardService,
    social: Awaited<ReturnType<typeof loadSocial>>,
  ) => {
    setLoading(true);
    setError(null);
    const loaded = await loadChoices(next, social);
    setChoices(loaded.choices);
    setNeedsConnect(loaded.needsConnect);
    setStep('choose');
    setLoading(false);
  };

  const opened = useRef<string | null>(null);
  useEffect(() => {
    if (!start) {
      opened.current = null;
      return;
    }
    if (start === 'pick') {
      if (opened.current !== 'pick') {
        opened.current = 'pick';
        setStep('source');
        setService(null);
      }
      return;
    }
    if (opened.current === start) {
      return;
    }
    opened.current = start;
    void begin(start);
  });

  const openReview = async () => {
    if (!service) {
      return;
    }
    if (service === 'soundcloud') {
      setStep('review');
      return;
    }
    setLoading(true);
    const { data } = await fetchStudioCollections();
    const rows = data.flatMap((item) =>
      item.id ? [{ id: item.id, name: item.name }] : [],
    );
    setCollections(rows);
    setCollectionId(rows[0]?.id ?? null);
    setLoading(false);
    setStep('review');
  };

  if (!start) {
    return null;
  }

  const name = service ? SERVICE_NAME[service] : '';
  const chosen = choices.filter((choice) => selected.includes(choice.id));
  const needsCollection = service !== null && service !== 'soundcloud';
  const title =
    step === 'progress' && total > 0 && done === total
      ? t('library.importWizardDone')
      : step === 'account'
        ? t('library.importWizardConnect', { service: name })
        : step === 'choose'
          ? t('library.importWizardChoose')
          : step === 'review'
            ? t('library.importWizardReview')
            : step === 'progress'
              ? t('library.importWizardProgress')
              : t('library.importWizardTitle');

  const saveProfile = async () => {
    if (!service) {
      return;
    }
    const value = profileDraft.trim();
    if (!value) {
      return;
    }
    setLoading(true);
    setError(null);
    const profile = await fetchMeProfile();
    const saved = await patchMeProfile({
      socialLinks: {
        ...(profile.data.socialLinks ?? {}),
        [SOCIAL_KEY[service]]: value,
      },
    });
    if (!saved.ok) {
      setError(saved.error);
      setLoading(false);
      return;
    }
    const social = await loadSocial();
    setSkippedAccount(false);
    await showChoices(service, social);
  };

  const accept = async () => {
    if (!service) {
      return;
    }
    setStep('progress');
    setError(null);
    setDone(0);
    const units = await expandChoices(service, chosen);
    setTotal(units.length);
    if (units.length === 0) {
      setError(t('library.importWizardNothingToImport'));
      return;
    }
    for (let index = 0; index < units.length; index += 1) {
      const unit = units[index];
      if (!unit) {
        continue;
      }
      const result = await importOne(unit, collectionId);
      if (!result.ok) {
        setDone(index);
        setError(result.error);
        return;
      }
      setDone(index + 1);
    }
  };

  const visible = (kind: ImportChoice['kind']) =>
    choices.filter((choice) => choice.kind === kind);
  const tracks = visible('track');
  const playlists = visible('playlist');

  const list = (items: ImportChoice[]) => (
    <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto">
      {items.length > 1 ? (
        <li>
          <Checkbox
            label={t('library.importWizardSelectAll')}
            checked={items.every((item) => selected.includes(item.id))}
            onChange={(checked) => {
              const ids = items.map((item) => item.id);
              setSelected((current) =>
                checked
                  ? [...new Set([...current, ...ids])]
                  : current.filter((id) => !ids.includes(id)),
              );
            }}
          />
        </li>
      ) : null}
      {items.map((item) => (
        <li key={item.id}>
          <Checkbox
            label={item.title}
            checked={selected.includes(item.id)}
            onChange={(checked) =>
              setSelected((current) =>
                checked
                  ? [...current, item.id]
                  : current.filter((id) => id !== item.id),
              )
            }
          />
          {item.subtitle ? (
            <p className="text-foreground-secondary ps-6 text-xs">
              {item.subtitle}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );

  return (
    <Dialog
      isOpen
      onClose={onClose}
      title={title}
      description={
        step === 'source' ? t('library.importWizardSourceHint') : undefined
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {step === 'choose' || step === 'review' || step === 'account' ? (
            <Button
              variant="text"
              onClick={() =>
                setStep(
                  step === 'review'
                    ? 'choose'
                    : step === 'choose' && !skippedAccount
                      ? 'account'
                      : 'source',
                )
              }
            >
              {t('library.importWizardBack')}
            </Button>
          ) : null}
          {step === 'choose' ? (
            <Button
              disabled={selected.length === 0}
              onClick={() => void openReview()}
            >
              {t('library.importWizardContinue')}
            </Button>
          ) : null}
          {step === 'review' ? (
            <Button
              disabled={needsCollection && !collectionId}
              onClick={() => void accept()}
            >
              {t('library.importWizardAccept')}
            </Button>
          ) : null}
          {step === 'progress' && (done === total || error) ? (
            <Button onClick={onClose}>{t('actions.close')}</Button>
          ) : null}
        </div>
      }
    >
      <div className="flex flex-col gap-3" data-testid="import-wizard">
        {loading ? (
          <p className="text-foreground-secondary text-sm" role="status">
            {t('library.uploadSourceChecking')}
          </p>
        ) : null}
        {error ? <InlineError>{error}</InlineError> : null}
        {step === 'source' ? (
          <div className="flex flex-col gap-2">
            {WIZARD_SERVICES.map((id) => (
              <Button
                key={id}
                variant="secondary"
                className="justify-start"
                onClick={() => void begin(id)}
              >
                {SERVICE_NAME[id]}
              </Button>
            ))}
          </div>
        ) : null}
        {step === 'account' && service ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void saveProfile();
            }}
          >
            <Input
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              label={t('library.importWizardProfile', { service: name })}
              value={profileDraft}
              onChange={(event) => setProfileDraft(event.target.value)}
              placeholder="https://"
            />
            <Button type="submit" disabled={!profileDraft.trim() || loading}>
              {t('library.importWizardSaveProfile')}
            </Button>
            {service === 'soundcloud' ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  window.location.href = soundcloudSourceAdapter.oauthUrl;
                }}
              >
                {t('library.importWizardConnect', { service: name })}
              </Button>
            ) : null}
          </form>
        ) : null}
        {step === 'choose' && !loading ? (
          <>
            {needsConnect && service === 'soundcloud' ? (
              <Button
                onClick={() => {
                  window.location.href = soundcloudSourceAdapter.oauthUrl;
                }}
              >
                {t('library.importWizardConnect', { service: name })}
              </Button>
            ) : null}
            {choices.length === 0 && !needsConnect ? (
              <p className="text-foreground-secondary text-sm">
                {t('library.importWizardEmpty')}
              </p>
            ) : null}
            {tracks.length > 0 && playlists.length > 0 ? (
              <Tabs
                items={[
                  {
                    id: 'track',
                    label: t('library.importWizardTracks'),
                    content: list(tracks),
                  },
                  {
                    id: 'playlist',
                    label: t('library.importWizardPlaylists'),
                    content: list(playlists),
                  },
                ]}
              />
            ) : (
              list(tracks.length > 0 ? tracks : playlists)
            )}
          </>
        ) : null}
        {step === 'review' ? (
          <>
            <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto text-sm">
              {chosen.map((item) => (
                <li key={item.id}>
                  {item.title}
                  <span className="text-foreground-secondary">
                    {' '}
                    ·{' '}
                    {item.kind === 'playlist'
                      ? t('library.importWizardPlaylist')
                      : t('library.importWizardTrack')}
                  </span>
                </li>
              ))}
            </ul>
            {needsCollection ? (
              collections.length > 0 ? (
                <Select
                  label={t('library.importWizardCollection')}
                  options={collections.map((item) => ({
                    id: item.id,
                    label: item.name,
                  }))}
                  value={collectionId ?? undefined}
                  onValueChange={setCollectionId}
                />
              ) : (
                <p className="text-foreground-secondary text-sm">
                  {t('library.importWizardNoCollection')}{' '}
                  <Link to="/library/collections" className="underline">
                    {t('library.importWizardCollections')}
                  </Link>
                </p>
              )
            ) : null}
          </>
        ) : null}
        {step === 'progress' ? (
          <div className="flex flex-col gap-2">
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={Math.max(total, 1)}
              aria-valuenow={done}
              aria-label={t('library.importWizardProgress')}
              className="bg-background-secondary h-2 w-full overflow-hidden rounded-full"
            >
              <div
                className="bg-primary h-full"
                style={{
                  width: `${total === 0 ? 0 : (done / total) * 100}%`,
                }}
              />
            </div>
            <p className="text-foreground-secondary text-sm" role="status">
              {t('library.importWizardCount', { done, total })}
            </p>
          </div>
        ) : null}
        {step !== 'progress' ? (
          <Link to="/help" className="text-sm underline">
            {t('library.importWizardHelp')}
          </Link>
        ) : null}
      </div>
    </Dialog>
  );
}
