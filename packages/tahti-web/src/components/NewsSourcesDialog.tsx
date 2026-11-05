import { TrashIcon } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Dialog, Input, Tooltip } from '@tahti-player/ui';

import { isHttpUrl } from '../lib/parseRss';
import {
  NEWS_WIDGET_TYPE_ID,
  useListenerWidgetsStore,
} from '../stores/listenerWidgetsStore';
import { NewsFeedSuggestions } from './NewsFeedSuggestions';
import { PageEmpty } from './PageStates';

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

/** Add and remove the RSS feeds that Latest News merges together. */
export function NewsSourcesDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation('web');
  const instances = useListenerWidgetsStore((state) => state.instances);
  const addInstance = useListenerWidgetsStore((state) => state.addInstance);
  const installType = useListenerWidgetsStore((state) => state.installType);
  const removeInstance = useListenerWidgetsStore(
    (state) => state.removeInstance,
  );
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const sources = instances.filter(
    (instance) => instance.typeId === NEWS_WIDGET_TYPE_ID,
  );
  const addedUrls = new Set(sources.map((source) => source.input));

  const add = (feedUrl: string, label: string) => {
    installType(NEWS_WIDGET_TYPE_ID);
    addInstance(NEWS_WIDGET_TYPE_ID, feedUrl, label);
  };

  const addCustom = () => {
    const trimmed = url.trim();
    if (!isHttpUrl(trimmed)) {
      setError('Paste an http(s) RSS or Atom feed URL.');
      return;
    }
    if (addedUrls.has(trimmed)) {
      setError('That feed is already a source.');
      return;
    }
    add(trimmed, title.trim() || hostOf(trimmed));
    setTitle('');
    setUrl('');
    setError(null);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="News sources"
      description="Latest News merges these feeds, newest first."
      actions={<Dialog.Close>Done</Dialog.Close>}
    >
      <div
        className="flex max-h-[65vh] flex-col gap-5 overflow-y-auto pr-1"
        data-testid="news-sources"
      >
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-bold">Your sources</h3>
          {sources.length === 0 ? (
            <PageEmpty title={t('empties.noNewsSources')} />
          ) : (
            <ul
              aria-label="Your sources"
              className="divide-border flex flex-col divide-y"
            >
              {sources.map((source) => (
                <li
                  key={source.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">
                      {source.label}
                    </span>
                    <span className="text-foreground-secondary block truncate text-xs">
                      {hostOf(source.input)}
                    </span>
                  </span>
                  <Tooltip content={`Remove ${source.label}`} side="top">
                    <Button
                      size="icon-sm"
                      variant="text"
                      aria-label={`Remove ${source.label}`}
                      onClick={() => removeInstance(source.id)}
                    >
                      <TrashIcon size={14} aria-hidden />
                    </Button>
                  </Tooltip>
                </li>
              ))}
            </ul>
          )}
        </section>
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            addCustom();
          }}
        >
          <h3 className="text-sm font-bold">Add a feed</h3>
          <Input
            label="Name"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="DJWORX"
          />
          <Input
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            label="RSS or Atom URL"
            value={url}
            onChange={(event) => {
              setError(null);
              setUrl(event.target.value);
            }}
            placeholder="https://example.com/feed/"
            required
          />
          {error ? (
            <p className="text-destructive text-xs" role="alert">
              {error}
            </p>
          ) : null}
          <Button size="sm" type="submit" className="self-start">
            Add source
          </Button>
        </form>
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-bold">Suggested feeds</h3>
          <NewsFeedSuggestions
            addedUrls={addedUrls}
            onAdd={(feed) => add(feed.url, feed.title)}
          />
        </section>
      </div>
    </Dialog>
  );
}
