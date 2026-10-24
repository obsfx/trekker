export interface WaveFrame {
  time: number;
  pointer: { x: number; y: number };
  focus: readonly [number, number, number];
}
