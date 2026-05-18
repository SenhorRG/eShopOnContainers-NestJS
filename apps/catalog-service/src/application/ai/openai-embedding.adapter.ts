import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { axiosWithPolicy, createResilientAxios } from '@eshop/http-resilience';

import { ESHOP_EMBEDDING_DIMENSION, type CatalogAiPort } from './catalog-ai.port';

@Injectable()
export class OpenAiEmbeddingAdapter implements CatalogAiPort {
  private readonly resilient = createResilientAxios('openAi');

  readonly isEnabled;

  constructor(private readonly config: ConfigService) {
    this.isEnabled =
      !!this.config.get<string>('ESHOP_OPENAI_EMBEDDINGS_API_KEY') &&
      !!this.config.get<string>('ESHOP_OPENAI_EMBEDDINGS_URL');
  }

  private trim384(vec: number[]): number[] {
    return vec.length <= ESHOP_EMBEDDING_DIMENSION ? vec : vec.slice(0, ESHOP_EMBEDDING_DIMENSION);
  }

  async embeddingForCatalogLine(name: string, description?: string | null): Promise<number[] | null> {
    return this.embeddingForSearchText(`${name} ${description ?? ''}`.trim());
  }

  async embeddingForSearchText(text: string): Promise<number[] | null> {
    if (!this.isEnabled || !text) return null;

    const url =
      this.config.get<string>('ESHOP_OPENAI_EMBEDDINGS_URL') ??
      'https://api.openai.com/v1/embeddings';
    const key = this.config.get<string>('ESHOP_OPENAI_EMBEDDINGS_API_KEY');
    const model =
      this.config.get<string>('ESHOP_OPENAI_EMBEDDINGS_MODEL') ?? 'text-embedding-3-small';

    try {
      type OpenAiEmb = { data?: Array<{ embedding?: number[] }> };
      const res = await axiosWithPolicy<OpenAiEmb>(this.resilient, {
        url,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        data: { input: text, model },
      });
      const emb = res.data.data?.[0]?.embedding;
      if (!emb || !emb.length) return null;
      return this.trim384(emb);
    } catch {
      return null;
    }
  }
}
