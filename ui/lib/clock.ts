import dayjs from 'dayjs';
import { createStore } from 'zustand/vanilla';

interface ClockState {
  now: number;
}

export class Clock {
  static readonly minuteMs = 60_000;

  readonly store = createStore<ClockState>()(() => {
    return { now: dayjs().valueOf() };
  });

  private readonly tickMs: number;

  constructor(tickMs: number) {
    this.tickMs = tickMs;
  }

  start() {
    const timer = setInterval(() => {
      this.store.setState({ now: dayjs().valueOf() });
    }, this.tickMs);
    return () => {
      clearInterval(timer);
    };
  }
}
