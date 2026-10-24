export abstract class ReleaseMatrix {
  static previousTrekkerBin(version: string): string {
    return `/opt/trekker/${version}/node_modules/.bin/trekker`;
  }
}
export const PREVIOUS_TREKKER_VERSIONS = [
  '1.0.0',
  '1.2.2',
  '1.4.0',
  '1.8.0',
  '1.10.2',
  '1.11.0',
] as const;

export const CONTAINER_IMAGE = 'trekker-it:local';
