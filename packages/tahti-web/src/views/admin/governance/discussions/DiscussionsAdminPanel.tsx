import { Link } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Badge,
  Button,
  InlineError,
  Input,
  Textarea,
  Toggle,
} from '@tahti-player/ui';

import {
  createDiscussionTopic,
  fetchDiscussionTopics,
  updateDiscussionTopic,
  type DiscussionTopic,
  type UpdateDiscussionTopicInput,
} from '../../../../api/governance-discussions';
import {
  PageEmpty,
  PageError,
  PageLoading,
} from '../../../../components/PageStates';
import { StudioPanel } from '../../../../components/StudioPanel';

function NewTopicForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <div>
        <Button size="sm" onClick={() => setOpen(true)}>
          Open a topic
        </Button>
      </div>
    );
  }

  const canSubmit = title.trim().length >= 3 && body.trim().length > 0;

  const submit = async () => {
    setBusy(true);
    setError(null);
    const result = await createDiscussionTopic({
      title: title.trim(),
      body: body.trim(),
      pinned,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success('Topic opened. Every member is notified.');
    setTitle('');
    setBody('');
    setPinned(false);
    setOpen(false);
    onCreated();
  };

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <Input
        label="Title"
        value={title}
        maxLength={160}
        onChange={(event) => setTitle(event.target.value)}
        required
      />
      <Textarea
        label="What should members talk about?"
        value={body}
        maxLength={10000}
        rows={5}
        onChange={(event) => setBody(event.target.value)}
      />
      <Toggle label="Pin to the top" checked={pinned} onChange={setPinned} />
      {error ? <InlineError>{error}</InlineError> : null}
      <p className="text-foreground-secondary text-xs">
        Every member gets a notification when the topic opens.
      </p>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy || !canSubmit}>
          {busy ? 'Opening…' : 'Open topic'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="text"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

function EditTopicForm({
  topic,
  onDone,
}: {
  topic: DiscussionTopic;
  onDone: (saved: boolean) => void;
}) {
  const [title, setTitle] = useState(topic.title);
  const [body, setBody] = useState(topic.body);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const changed = title.trim() !== topic.title || body.trim() !== topic.body;
  const valid = title.trim().length >= 3 && body.trim().length > 0;

  const save = async () => {
    setBusy(true);
    setError(null);
    const result = await updateDiscussionTopic(topic.id, {
      title: title.trim(),
      body: body.trim(),
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success('Topic updated.');
    onDone(true);
  };

  return (
    <form
      className="flex w-full flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <Input
        label="Title"
        value={title}
        maxLength={160}
        onChange={(event) => setTitle(event.target.value)}
        required
      />
      <Textarea
        label="Topic text"
        value={body}
        maxLength={10000}
        rows={5}
        onChange={(event) => setBody(event.target.value)}
      />
      {error ? <InlineError>{error}</InlineError> : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy || !changed || !valid}>
          {busy ? 'Saving…' : 'Save'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="text"
          onClick={() => onDone(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

function TopicRow({
  topic,
  onChanged,
}: {
  topic: DiscussionTopic;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  const update = async (input: UpdateDiscussionTopicInput, done: string) => {
    setBusy(true);
    const result = await updateDiscussionTopic(topic.id, input);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(done);
    onChanged();
  };

  if (editing) {
    return (
      <li className="py-2">
        <EditTopicForm
          topic={topic}
          onDone={(saved) => {
            setEditing(false);
            if (saved) {
              onChanged();
            }
          }}
        />
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-2">
      <div className="flex min-w-0 flex-col">
        <Link
          to="/governance/discussions/$id"
          params={{ id: topic.id }}
          className="font-medium hover:underline"
        >
          {topic.title}
        </Link>
        <span className="text-foreground-secondary flex flex-wrap items-center gap-2 text-xs">
          {topic.postCount === 1 ? '1 reply' : `${topic.postCount} replies`}
          {topic.pinned ? (
            <Badge variant="pill" color="yellow">
              Pinned
            </Badge>
          ) : null}
          <Badge
            variant="pill"
            color={topic.status === 'OPEN' ? 'green' : 'secondary'}
          >
            {topic.status === 'OPEN' ? 'Open' : 'Closed'}
          </Badge>
        </span>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="text"
          disabled={busy}
          onClick={() => setEditing(true)}
        >
          Edit
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() =>
            void update(
              { pinned: !topic.pinned },
              topic.pinned ? 'Topic unpinned.' : 'Topic pinned.',
            )
          }
        >
          {topic.pinned ? 'Unpin' : 'Pin'}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() =>
            void update(
              { status: topic.status === 'OPEN' ? 'CLOSED' : 'OPEN' },
              topic.status === 'OPEN'
                ? 'Topic closed to replies.'
                : 'Topic reopened.',
            )
          }
        >
          {topic.status === 'OPEN' ? 'Close' : 'Reopen'}
        </Button>
      </div>
    </li>
  );
}

/** Admin → Governance → Discussions: open topics for members and keep them
 * tidy (pin, close, reopen). */
export function DiscussionsAdminPanel() {
  const [topics, setTopics] = useState<DiscussionTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(() => {
    void fetchDiscussionTopics().then((result) => {
      setTopics(result.data);
      setLoadError(
        result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
      );
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <StudioPanel
      title="Discussions"
      description="Topics members can reply to. Nothing here is a vote; use motions for decisions."
    >
      <div className="flex flex-col gap-4">
        <NewTopicForm onCreated={load} />
        {loading ? (
          <PageLoading label="Loading topics…" />
        ) : loadError && topics.length === 0 ? (
          <PageError
            title="Could not load the topics"
            description={loadError}
            onRetry={load}
          />
        ) : topics.length === 0 ? (
          <PageEmpty title="No topics yet" />
        ) : (
          <ul className="divide-border divide-y" aria-label="Topics">
            {topics.map((topic) => (
              <TopicRow key={topic.id} topic={topic} onChanged={load} />
            ))}
          </ul>
        )}
      </div>
    </StudioPanel>
  );
}
