import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { putWithProgress, UploadAbortedError } from './putWithProgress';

class FakeXhr {
  static last: FakeXhr | null = null;
  method = '';
  url = '';
  headers: Record<string, string> = {};
  status = 0;
  body: unknown = null;
  upload: { onprogress: ((event: ProgressEvent) => void) | null } = {
    onprogress: null,
  };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  constructor() {
    FakeXhr.last = this;
  }
  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }
  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }
  send(body: unknown) {
    this.body = body;
  }
  abort() {
    this.onabort?.();
  }
}

describe('putWithProgress', () => {
  beforeEach(() => {
    vi.stubGlobal('XMLHttpRequest', FakeXhr);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('PUTs the file and reports progress', async () => {
    const onProgress = vi.fn();
    const file = new Blob(['abc']);
    const done = putWithProgress('https://s3.example/put', file, {
      contentType: 'audio/flac',
      onProgress,
    });
    const xhr = FakeXhr.last!;
    expect(xhr.method).toBe('PUT');
    expect(xhr.headers['Content-Type']).toBe('audio/flac');
    expect(xhr.body).toBe(file);
    xhr.upload.onprogress?.({
      lengthComputable: true,
      loaded: 25,
      total: 100,
    } as ProgressEvent);
    xhr.status = 200;
    xhr.onload?.();
    await expect(done).resolves.toBeUndefined();
    expect(onProgress).toHaveBeenNthCalledWith(1, 0.25);
    expect(onProgress).toHaveBeenLastCalledWith(1);
  });

  it('rejects on a storage error status', async () => {
    const done = putWithProgress('u', new Blob(['a']), {
      contentType: 'audio/wav',
    });
    FakeXhr.last!.status = 403;
    FakeXhr.last!.onload?.();
    await expect(done).rejects.toThrow('Upload failed (403)');
  });

  it('aborts when the signal fires', async () => {
    const controller = new AbortController();
    const done = putWithProgress('u', new Blob(['a']), {
      contentType: 'audio/wav',
      signal: controller.signal,
    });
    controller.abort();
    await expect(done).rejects.toBeInstanceOf(UploadAbortedError);
  });
});
