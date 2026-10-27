import { useEffect, useRef, useState } from 'react';

import { encodeWav } from '@tahti-player/audio-editor';
import { Button, InlineError, Select } from '@tahti-player/ui';

export function VoiceRecorder({
  onUse,
  disabled = false,
}: {
  onUse: (file: File) => void;
  disabled?: boolean;
}) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState('default');
  const [state, setState] = useState<
    'idle' | 'starting' | 'recording' | 'stopping'
  >('idle');
  const [take, setTake] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState('');
  const mounted = useRef(true);
  const release = useRef<(() => void) | null>(null);
  const stop = useRef<(() => void) | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      release.current?.();
    };
  }, []);
  useEffect(() => {
    if (!take) {
      setUrl('');
      return;
    }
    const next = URL.createObjectURL(take);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [take]);

  const record = async () => {
    setState('starting');
    setError('');
    setSeconds(0);
    setLevel(0);
    let stream: MediaStream | undefined;
    let context: AudioContext | undefined;
    try {
      if (
        !navigator.mediaDevices?.getUserMedia ||
        !globalThis.AudioWorkletNode
      ) {
        throw new Error(
          'Voice recording needs a supported browser on HTTPS. You can upload an audio file instead.',
        );
      }
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceId === 'default' ? undefined : { exact: deviceId },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      const tracks = stream.getTracks();
      if (!mounted.current) {
        tracks.forEach((t) => t.stop());
        return;
      }
      context = new AudioContext();
      const ctx = context;
      const chunks: Float32Array[] = [];
      let frames = 0;
      let peak = 0;
      let finishing = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let released = false;
      const cleanup = () => {
        if (released) {
          return;
        }
        released = true;
        clearTimeout(timer);
        tracks.forEach((t) => t.stop());
        void ctx.close();
        release.current = null;
        stop.current = null;
      };
      release.current = cleanup;
      await ctx.audioWorklet.addModule('/audio/clip-recorder.js');
      if (!mounted.current) {
        cleanup();
        return;
      }
      const node = new AudioWorkletNode(ctx, 'clip-recorder');
      const input = ctx.createMediaStreamSource(stream);
      input.connect(node);
      node.connect(ctx.destination);
      const limit = Math.min(
        600 * ctx.sampleRate,
        Math.floor((50 * 1024 * 1024 - 58) / 4),
      );
      const finish = () => {
        if (finishing) {
          return;
        }
        finishing = true;
        setState('stopping');
        node.port.postMessage('stop');
        timer = setTimeout(() => {
          cleanup();
          if (mounted.current) {
            setState('idle');
            setError('Recording stopped unexpectedly. Please try again.');
          }
        }, 3000);
      };
      stop.current = finish;
      node.port.onmessage = (event: MessageEvent<Float32Array | string>) => {
        if (!mounted.current) {
          return;
        }
        if (event.data === 'stopped') {
          if (frames && peak > 0.0001) {
            const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
            let offset = 0;
            for (const chunk of chunks) {
              buffer.copyToChannel(new Float32Array(chunk), 0, offset);
              offset += chunk.length;
            }
            setTake(
              new File(
                [encodeWav(buffer, { float32: true })],
                'Voice clip.wav',
                { type: 'audio/wav' },
              ),
            );
          } else {
            setError(
              'No voice was captured. Check your microphone and try again.',
            );
          }
          cleanup();
          setState('idle');
          setLevel(0);
          return;
        }
        if (typeof event.data === 'string') {
          return;
        }
        const chunk = event.data.slice(0, Math.max(0, limit - frames));
        if (chunk.length) {
          chunks.push(chunk);
          frames += chunk.length;
          let currentPeak = 0;
          for (const sample of chunk) {
            currentPeak = Math.max(currentPeak, Math.abs(sample));
          }
          peak = Math.max(peak, currentPeak);
          setLevel(currentPeak);
          setSeconds(frames / ctx.sampleRate);
        }
        if (frames >= limit) {
          finish();
        }
      };
      tracks.forEach((track) => {
        track.onended = finish;
      });
      await ctx.resume();
      if (!mounted.current) {
        cleanup();
        return;
      }
      setState('recording');
      void navigator.mediaDevices
        .enumerateDevices()
        .then((list) => {
          if (mounted.current) {
            setDevices(list.filter((d) => d.kind === 'audioinput'));
          }
        })
        .catch(() => undefined);
    } catch (err) {
      stream?.getTracks().forEach((t) => t.stop());
      if (context && context.state !== 'closed') {
        void context.close();
      }
      release.current = null;
      if (mounted.current) {
        setState('idle');
        setError(
          err instanceof Error || err instanceof DOMException
            ? err.message
            : 'Could not start recording',
        );
      }
    }
  };

  return (
    <div className="border-border flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <Select
            label="Microphone"
            value={deviceId}
            disabled={state !== 'idle' || disabled}
            options={[
              { id: 'default', label: 'Default microphone' },
              ...devices
                .filter((d) => d.deviceId && d.deviceId !== 'default')
                .map((d, i) => ({
                  id: d.deviceId,
                  label: d.label || `Microphone ${i + 1}`,
                })),
            ]}
            onValueChange={setDeviceId}
          />
        </div>
        <Button
          disabled={disabled || state === 'starting' || state === 'stopping'}
          onClick={() =>
            state === 'recording' ? stop.current?.() : void record()
          }
        >
          {state === 'recording'
            ? 'Stop recording'
            : state === 'starting'
              ? 'Opening microphone…'
              : state === 'stopping'
                ? 'Finishing…'
                : take
                  ? 'Record another take'
                  : 'Record voice'}
        </Button>
      </div>
      {state === 'recording' && (
        <div role="status" className="flex items-center gap-3 text-sm">
          <span>{Math.floor(seconds)} s · recording WAV</span>
          <meter aria-label="Microphone level" min={0} max={1} value={level} />
          <span>
            {level >= 0.98 ? 'Too loud — lower your microphone gain' : ''}
          </span>
        </div>
      )}
      <p className="text-foreground-secondary text-xs">
        Lossless WAV · up to 10 minutes / 50 MB. Your microphone stops when you
        finish or leave this page.
      </p>
      {url && (
        <>
          <audio aria-label="Recorded voice preview" src={url} controls />
          <Button
            disabled={disabled || state !== 'idle'}
            onClick={() => {
              if (take) {
                onUse(take);
              }
            }}
          >
            Use recording
          </Button>
        </>
      )}
      {error && <InlineError>{error}</InlineError>}
    </div>
  );
}
