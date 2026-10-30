import type { HistoryEvent } from '@/ui/lib/history-shapes.ts';

export interface EventSignal {
  kind: 'event';
  event: HistoryEvent;
}

export interface ResetSignal {
  kind: 'reset';
}

export type StreamSignal = EventSignal | ResetSignal;

export type StreamListener = (signal: StreamSignal) => void;

export interface EventStream {
  subscribe: (listener: StreamListener) => () => void;
  ready: () => Promise<void>;
}
