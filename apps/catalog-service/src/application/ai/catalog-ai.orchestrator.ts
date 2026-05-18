import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AzureOpenAiEmbeddingAdapter } from './azure-openai-embedding.adapter';
import { type CatalogAiPort } from './catalog-ai.port';
import { NoopCatalogAiService } from './noop-catalog-ai.service';
import { OllamaEmbeddingAdapter } from './ollama-embedding.adapter';
import { OpenAiEmbeddingAdapter } from './openai-embedding.adapter';

/**
 * Embedding backend matrix via `ESHOP_CATALOG_EMBEDDINGS_PROVIDER`:
 * `off` | `openai` | `ollama` | `azureOpenAi` | `auto` (default — legacy precedence: Ollama flag → OpenAI keys → Azure keys → noop).
 */
@Injectable()
export class CatalogAiOrchestrator implements CatalogAiPort {
  constructor(
    private readonly config: ConfigService,
    private readonly noop: NoopCatalogAiService,
    private readonly ollama: OllamaEmbeddingAdapter,
    private readonly openai: OpenAiEmbeddingAdapter,
    private readonly azure: AzureOpenAiEmbeddingAdapter,
  ) {}

  get isEnabled(): boolean {
    return this.core() !== this.noop;
  }

  private explicitMode(): string {
    return (this.config.get<string>('ESHOP_CATALOG_EMBEDDINGS_PROVIDER') ?? 'auto').trim().toLowerCase();
  }

  private core(): CatalogAiPort {
    const mode = this.explicitMode();

    if (mode === 'off' || mode === 'none' || mode === 'disabled') {
      return this.noop;
    }
    if (mode === 'openai') {
      return this.openai.isEnabled ? this.openai : this.noop;
    }
    if (mode === 'ollama') {
      return this.ollama.isEnabled ? this.ollama : this.noop;
    }
    if (mode === 'azureopenai' || mode === 'azure_open_ai' || mode === 'azure') {
      return this.azure.isEnabled ? this.azure : this.noop;
    }

    if (this.ollama.isEnabled) return this.ollama;
    if (this.openai.isEnabled) return this.openai;
    if (this.azure.isEnabled) return this.azure;
    return this.noop;
  }

  async embeddingForCatalogLine(name: string, description?: string | null): Promise<number[] | null> {
    return this.core().embeddingForCatalogLine(name, description);
  }

  async embeddingForSearchText(text: string): Promise<number[] | null> {
    return this.core().embeddingForSearchText(text);
  }
}
