import { useId, useMemo, useState } from 'react';

import { Alert, CopyButton, FilePicker, Textarea } from '@tahti-player/ui';

import { StudioPanel } from '../../../../components/StudioPanel';
import { MidiPhraseError, parseMidiPhrase } from './parseMidiPhrase';
import {
  analyzePhrase,
  describePhrase,
  phraseToPrompt,
  type Phrase,
} from './phraseAnalysis';

export type LoadedPhrase = { fileName: string; phrase: Phrase };

type PromptScoreBridgePanelProps = {
  initial?: LoadedPhrase;
};

const MAX_MIDI_BYTES = 2 * 1024 * 1024;

export function PromptScoreBridgePanel({
  initial,
}: PromptScoreBridgePanelProps) {
  const promptId = useId();
  const [loaded, setLoaded] = useState<LoadedPhrase | null>(initial ?? null);
  const [error, setError] = useState<string | null>(null);
  const description = useMemo(
    () => (loaded ? analyzePhrase(loaded.phrase) : null),
    [loaded],
  );
  const [prompt, setPrompt] = useState(() =>
    description ? phraseToPrompt(description) : '',
  );

  const loadFile = async (file: File) => {
    setError(null);
    if (file.size > MAX_MIDI_BYTES) {
      setError('That file is too large for a phrase. Use a short MIDI clip.');
      return;
    }
    try {
      const phrase = parseMidiPhrase(await file.arrayBuffer());
      const next = analyzePhrase(phrase);
      setLoaded({ fileName: file.name, phrase });
      setPrompt(next ? phraseToPrompt(next) : '');
    } catch (err) {
      setLoaded(null);
      setPrompt('');
      setError(
        err instanceof MidiPhraseError
          ? err.message
          : 'This file could not be read as MIDI.',
      );
    }
  };

  return (
    <StudioPanel
      title="Describe a melody"
      description="Drop a short MIDI phrase to get a plain description and a prompt snippet you can copy into a generator. Everything runs in this browser."
    >
      <div className="flex flex-col gap-4">
        <FilePicker
          accept=".mid,.midi,audio/midi,audio/x-midi"
          labels={{
            title: 'MIDI phrase',
            description: '.mid or .midi, a few bars works best',
            browse: 'Choose file',
            selected: 'Analysed',
          }}
          selectedFiles={
            loaded ? [new File([], loaded.fileName, { lastModified: 0 })] : []
          }
          onFiles={(files) => {
            const file = files[0];
            if (file) {
              void loadFile(file);
            }
          }}
        />

        {error ? <Alert tone="error">{error}</Alert> : null}

        {description ? (
          <>
            <ul
              aria-label="Melody description"
              className="text-foreground-secondary flex flex-col gap-1 text-sm"
            >
              {describePhrase(description).map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor={promptId} className="text-sm font-semibold">
                  Prompt snippet
                </label>
                <CopyButton
                  text={prompt}
                  label="Copy"
                  variant="secondary"
                  toastMessage="Prompt snippet copied"
                  disabled={!prompt.trim()}
                />
              </div>
              <Textarea
                id={promptId}
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>
          </>
        ) : null}
      </div>
    </StudioPanel>
  );
}
