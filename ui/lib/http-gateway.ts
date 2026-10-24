import type { ApiClient } from '@/ui/lib/api-client.ts';

export abstract class HttpGateway {
  protected readonly api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }
}
