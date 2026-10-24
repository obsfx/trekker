export class WaveCanvasElement extends HTMLElement {
  private static readonly elementName = "wave-canvas";

  private stop: (() => void) | null = null;
  private readonly sizeObserver = new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    if (width > 0 && height > 0 && !this.stop) {
      this.mount();
    }
  });

  static register(): void {
    if (!customElements.get(WaveCanvasElement.elementName)) {
      customElements.define(WaveCanvasElement.elementName, WaveCanvasElement);
    }
  }

  connectedCallback(): void {
    this.sizeObserver.observe(this);
  }

  disconnectedCallback(): void {
    this.sizeObserver.disconnect();
    this.stop?.();
    this.stop = null;
  }

  private mount(): void {
    let isStopped = false;
    let stopRuntime: (() => void) | null = null;
    this.stop = () => {
      isStopped = true;
      stopRuntime?.();
    };
    import("@/src/lib/waves/wave-runtime").then(({ WaveRuntime }) => {
      if (isStopped) {
        return;
      }
      stopRuntime = WaveRuntime.create(this)?.start() ?? null;
    });
  }
}
