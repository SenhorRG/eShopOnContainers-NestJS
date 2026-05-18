import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { axiosWithPolicy, createResilientAxios } from '@eshop/http-resilience';

import { ESHOP_EMBEDDING_DIMENSION, type CatalogAiPort } from './catalog-ai.port';

/**
 * Azure OpenAI embeddings — deployment URL + `api-key` header (OpenAI-compatible response body).
 * Env: `ESHOP_AZURE_OPENAI_EMBEDDINGS_URL`, `ESHOP_AZURE_OPENAI_EMBEDDINGS_KEY`.
 */
@Injectable()
export class AzureOpenAiEmbeddingAdapter implements CatalogAiPort {
  private readonly resilient = createResilientAxios('openAi');

  readonly isEnabled;

  constructor(private readonly config: ConfigService) {
    this.isEnabled =
      !!this.config.get<string>('ESHOP_AZURE_OPENAI_EMBEDDINGS_KEY')?.trim() &&
      !!this.config.get<string>('ESHOP_AZURE_OPENAI_EMBEDDINGS_URL')?.trim();
  }

  private trim384(vec: number[]): number[] {
    return vec.length <= ESHOP_EMBEDDING_DIMENSION ? vec : vec.slice(0, ESHOP_EMBEDDING_DIMENSION);
  }

  async embeddingForCatalogLine(name: string, description?: string | null): Promise<number[] | null> {
    return this.embeddingForSearchText(`${name} ${description ?? ''}`.trim());
  }

  async embeddingForSearchText(text: string): Promise<number[] | null> {
    if (!this.isEnabled || !text) return null;

    const url = this.config.get<string>('ESHOP_AZURE_OPENAI_EMBEDDINGS_URL')!.replace(/\/$/, '');
    const key = this.config.get<string>('ESHOP_AZURE_OPENAI_EMBEDDINGS_KEY')!;

    try {
      type Emb = { data?: Array<{ embedding?: number[] }> };
      const res = await axiosWithPolicy<Emb>(this.resilient, {
        url,
        method: 'POST',
        headers: {
          'api-key': key,
          'Content-Type': 'application/json',
        },
        data: { input: text },
      });
      const emb = res.data.data?.[0]?.embedding;
      if (!emb?.length) return null;
      return this.trim384(emb);
    } catch {
      return null;
    }
  }
}
