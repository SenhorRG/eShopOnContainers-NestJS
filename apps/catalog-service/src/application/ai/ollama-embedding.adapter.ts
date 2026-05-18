import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { axiosWithPolicy, createResilientAxios } from '@eshop/http-resilience';

import { ESHOP_EMBEDDING_DIMENSION, type CatalogAiPort } from './catalog-ai.port';

@Injectable()
export class OllamaEmbeddingAdapter implements CatalogAiPort {
  private readonly resilient = createResilientAxios('openAi');

  readonly isEnabled;

  constructor(private readonly config: ConfigService) {
    const flag = this.config.get<string>('ESHOP_CATALOG_OLLAMA_ENABLED');
    this.isEnabled = flag === 'true' || flag === '1';
  }

  private trim384(vec: number[]): number[] {
    return vec.length <= ESHOP_EMBEDDING_DIMENSION ? vec : vec.slice(0, ESHOP_EMBEDDING_DIMENSION);
  }

  async embeddingForCatalogLine(name: string, description?: string | null): Promise<number[] | null> {
    return this.embeddingForSearchText(`${name} ${description ?? ''}`.trim());
  }

  async embeddingForSearchText(text: string): Promise<number[] | null> {
    if (!this.isEnabled || !text) return null;

    const base =
      this.config.get<string>('ESHOP_OLLAMA_BASE_URL')?.replace(/\/$/, '') ?? 'http://127.0.0.1:11434';
    const model = this.config.get<string>('ESHOP_OLLAMA_EMBEDDING_MODEL') ?? 'nomic-embed-text';

    try {
      const res = await axiosWithPolicy<{ embedding?: number[] }>(this.resilient, {
        url: `${base}/api/embeddings`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: { model, prompt: text },
      });
      const emb = res.data.embedding;
      if (!emb?.length) return null;
      return this.trim384(emb);
    } catch {
      return null;
    }
  }
}
