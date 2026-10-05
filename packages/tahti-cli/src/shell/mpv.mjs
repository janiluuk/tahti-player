import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { unlinkSync } from 'node:fs';
import { createConnection } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { CliError } from '../api-client.mjs';

const IPC_CONNECT_ATTEMPTS = 40;
const IPC_CONNECT_DELAY_MS = 50;

export function buildMpvArgs(socketPath) {
  return [
    '--no-video',
    '--idle=yes',
    '--force-window=no',
    '--really-quiet',
    `--input-ipc-server=${socketPath}`,
  ];
}

export function buildIpcCommand(command, requestId) {
  const payload = { command };
  if (requestId !== undefined) {
    payload.request_id = requestId;
  }
  return `${JSON.stringify(payload)}\n`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MpvController {
  #proc = null;
  #socketPath = null;
  #socket = null;
  #buffer = '';
  #nextId = 1;
  #pending = new Map();
  #onEnd = null;

  constructor({ onEnd } = {}) {
    this.#onEnd = onEnd ?? null;
  }

  get running() {
    return Boolean(this.#proc && !this.#proc.killed);
  }

  async start() {
    if (this.running) {
      return;
    }
    this.#socketPath = join(
      tmpdir(),
      `tahti-mpv-${process.pid}-${randomBytes(6).toString('hex')}.sock`,
    );
    let proc;
    try {
      proc = spawn('mpv', buildMpvArgs(this.#socketPath), {
        stdio: ['ignore', 'ignore', 'pipe'],
      });
    } catch (error) {
      throw new CliError(
        `Could not start mpv (${error?.message ?? error}). Install mpv and ensure it is on PATH.`,
      );
    }
    this.#proc = proc;

    proc.on('error', (error) => {
      if (error.code === 'ENOENT') {
        // Handled below when connect fails / we check exit.
      }
    });

    let stderr = '';
    proc.stderr?.on('data', (chunk) => {
      stderr += String(chunk);
    });

    try {
      await this.#connectWithRetry();
    } catch (error) {
      await this.stop();
      if (proc.exitCode !== null || stderr.includes('No such file')) {
        throw new CliError(
          'mpv is not installed or not on PATH. Install mpv, then run `tahti shell` again.',
        );
      }
      throw new CliError(
        `Could not connect to mpv IPC (${error?.message ?? error}).`,
      );
    }

    proc.on('exit', () => {
      this.#cleanupSocket();
      this.#rejectAll(new CliError('mpv exited unexpectedly.'));
      this.#proc = null;
      this.#socket = null;
    });
  }

  async #connectWithRetry() {
    let lastError;
    for (let i = 0; i < IPC_CONNECT_ATTEMPTS; i += 1) {
      if (this.#proc?.exitCode !== null && this.#proc?.exitCode !== undefined) {
        throw new CliError(
          'mpv is not installed or not on PATH. Install mpv, then run `tahti shell` again.',
        );
      }
      try {
        await this.#connectOnce();
        return;
      } catch (error) {
        lastError = error;

        await sleep(IPC_CONNECT_DELAY_MS);
      }
    }
    throw lastError ?? new CliError('Timed out waiting for mpv IPC socket.');
  }

  #connectOnce() {
    return new Promise((resolve, reject) => {
      const socket = createConnection(this.#socketPath);
      const onError = (error) => {
        socket.destroy();
        reject(error);
      };
      socket.once('error', onError);
      socket.once('connect', () => {
        socket.off('error', onError);
        this.#socket = socket;
        socket.setEncoding('utf8');
        socket.on('data', (chunk) => this.#onData(chunk));
        socket.on('error', () => {
          // Ignore late socket errors during shutdown.
        });
        resolve();
      });
    });
  }

  #onData(chunk) {
    this.#buffer += chunk;
    let newline = this.#buffer.indexOf('\n');
    while (newline !== -1) {
      const line = this.#buffer.slice(0, newline).trim();
      this.#buffer = this.#buffer.slice(newline + 1);
      if (line) {
        this.#handleLine(line);
      }
      newline = this.#buffer.indexOf('\n');
    }
  }

  #handleLine(line) {
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      return;
    }
    if (
      message.event === 'end-file' &&
      message.reason === 'eof' &&
      typeof this.#onEnd === 'function'
    ) {
      this.#onEnd();
    }
    if (message.request_id === undefined) {
      return;
    }
    const pending = this.#pending.get(message.request_id);
    if (!pending) {
      return;
    }
    this.#pending.delete(message.request_id);
    if (message.error && message.error !== 'success') {
      pending.reject(new CliError(`mpv: ${message.error}`));
      return;
    }
    pending.resolve(message.data);
  }

  #rejectAll(error) {
    for (const pending of this.#pending.values()) {
      pending.reject(error);
    }
    this.#pending.clear();
  }

  async command(args) {
    if (!this.#socket) {
      throw new CliError('mpv is not running.');
    }
    const requestId = this.#nextId;
    this.#nextId += 1;
    const written = buildIpcCommand(args, requestId);
    return new Promise((resolve, reject) => {
      this.#pending.set(requestId, { resolve, reject });
      this.#socket.write(written, (error) => {
        if (error) {
          this.#pending.delete(requestId);
          reject(error);
        }
      });
    });
  }

  async load(url, { append = false } = {}) {
    await this.command(['loadfile', url, append ? 'append-play' : 'replace']);
    if (!append) {
      await this.command(['set_property', 'pause', false]);
    }
  }

  async pause() {
    await this.command(['set_property', 'pause', true]);
  }

  async resume() {
    await this.command(['set_property', 'pause', false]);
  }

  async togglePause() {
    const paused = await this.command(['get_property', 'pause']);
    await this.command(['set_property', 'pause', !paused]);
    return !paused;
  }

  async seek(seconds) {
    await this.command(['seek', seconds, 'relative']);
  }

  async getTimePos() {
    try {
      return await this.command(['get_property', 'time-pos']);
    } catch {
      return null;
    }
  }

  async getDuration() {
    try {
      return await this.command(['get_property', 'duration']);
    } catch {
      return null;
    }
  }

  async getPaused() {
    try {
      return await this.command(['get_property', 'pause']);
    } catch {
      return true;
    }
  }

  async stop() {
    this.#rejectAll(new CliError('mpv stopped.'));
    if (this.#socket) {
      try {
        this.#socket.write(buildIpcCommand(['quit']));
      } catch {
        // ignore
      }
      this.#socket.destroy();
      this.#socket = null;
    }
    if (this.#proc && !this.#proc.killed) {
      this.#proc.kill('SIGTERM');
      this.#proc = null;
    }
    this.#cleanupSocket();
  }

  #cleanupSocket() {
    if (!this.#socketPath) {
      return;
    }
    try {
      unlinkSync(this.#socketPath);
    } catch {
      // already gone
    }
    this.#socketPath = null;
  }
}
