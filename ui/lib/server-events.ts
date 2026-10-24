import type { StoreApi } from 'zustand/vanilla';

import type { HistoryEvent } from '@/ui/lib/history-shapes.ts';

export type LiveState = 'live' | 'connecting' | 'offline';

export interface LiveStatus {
  state: LiveState;
}

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
  status: StoreApi<LiveStatus>;
  subscribe: (listener: StreamListener) => () => void;
  ready: () => Promise<void>;
}
