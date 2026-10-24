import dayjs from 'dayjs';

export interface SseMessage {
  event: string;
  id: string | null;
  data: string;
}

const DEFAULT_TIMEOUT_MS = 5_000;

export class SseReader {
  private readonly reader: ReadableStreamDefaultReader<Uint8Array>;
  private readonly decoder = new TextDecoder();
  private buffer = '';
  private readonly queue: SseMessage[] = [];

  constructor(body: ReadableStream<Uint8Array>) {
    this.reader = body.getReader();
  }

  static async open(url: string, headers: Record<string, string> = {}): Promise<SseReader> {
    const response = await fetch(url, { headers });
    if (!response.body) {
      throw new Error(`No SSE body from ${url} (status ${response.status})`);
    }
    return new SseReader(response.body);
  }

  async next(timeoutMs = DEFAULT_TIMEOUT_MS): Promise<SseMessage> {
    const deadline = dayjs().valueOf() + timeoutMs;
    while (this.queue.length === 0) {
      const remaining = deadline - dayjs().valueOf();
      if (remaining <= 0) {
        throw new Error('Timed out waiting for an SSE message');
      }
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise<null>((resolve) => {
        timer = setTimeout(() => {
          return resolve(null);
        }, remaining);
      });
      const chunk = await Promise.race([this.reader.read(), timeout]);
      clearTimeout(timer);
      if (chunk === null) {
        throw new Error('Timed out waiting for an SSE message');
      }
      if (chunk.done) {
        throw new Error('SSE stream ended');
      }
      this.buffer += this.decoder.decode(chunk.value);
      this.drain();
    }
    const message = this.queue.shift();
    if (!message) {
      throw new Error('SSE queue unexpectedly empty');
    }
    return message;
  }

  async until(
    predicate: (message: SseMessage) => boolean,
    timeoutMs = DEFAULT_TIMEOUT_MS
  ): Promise<SseMessage> {
    const deadline = dayjs().valueOf() + timeoutMs;
    for (;;) {
      const message = await this.next(Math.max(deadline - dayjs().valueOf(), 1));
      if (predicate(message)) {
        return message;
      }
    }
  }

  async close(): Promise<void> {
    await this.reader.cancel();
  }

  private drain(): void {
    for (;;) {
      const end = this.buffer.indexOf('\n\n');
      if (end === -1) {
        return;
      }
      const block = this.buffer.slice(0, end);
      this.buffer = this.buffer.slice(end + 2);
      this.queue.push(SseReader.parseBlock(block));
    }
  }

  private static parseBlock(block: string): SseMessage {
    const message: SseMessage = { event: 'message', id: null, data: '' };
    for (const line of block.split('\n')) {
      if (line.startsWith(':')) {
        message.event = 'comment';
        message.data = line.slice(1).trim();
      } else if (line.startsWith('event: ')) {
        message.event = line.slice('event: '.length);
      } else if (line.startsWith('id: ')) {
        message.id = line.slice('id: '.length);
      } else if (line.startsWith('data: ')) {
        message.data += line.slice('data: '.length);
      }
    }
    return message;
  }
}
