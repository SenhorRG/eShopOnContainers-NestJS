import { Injectable } from '@nestjs/common';

import { type CatalogAiPort } from './catalog-ai.port';

@Injectable()
export class NoopCatalogAiService implements CatalogAiPort {
  readonly isEnabled = false;

  async embeddingForCatalogLine(): Promise<null> {
    return null;
  }

  async embeddingForSearchText(): Promise<null> {
    return null;
  }
}
