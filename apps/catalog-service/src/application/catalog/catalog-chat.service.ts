import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { axiosWithPolicy, createResilientAxios } from '@eshop/http-resilience';

import type { CatalogChatMessageDto } from '../../api/catalog/dto/catalog-chat.dto';

export type CatalogChatStatusDto = {
  available: boolean;
  provider: 'ollama' | 'none';
};

type OllamaChatResponse = {
  message?: { role?: string; content?: string };
};

@Injectable()
export class CatalogChatService {
  private readonly resilient = createResilientAxios('openAi');

  constructor(private readonly config: ConfigService) {}

  getStatus(): CatalogChatStatusDto {
    const available = this.isChatBackendConfigured();
    return { available, provider: available ? 'ollama' : 'none' };
  }

  private isChatBackendConfigured(): boolean {
    const flag = (this.config.get<string>('ESHOP_CATALOG_CHAT_ENABLED') ?? '').trim().toLowerCase();
    if (!(flag === 'true' || flag === '1')) return false;
    const base = (this.config.get<string>('ESHOP_OLLAMA_BASE_URL') ?? '').trim();
    return base.length > 0;
  }

  private ollamaBase(): string {
    return (this.config.get<string>('ESHOP_OLLAMA_BASE_URL') ?? 'http://127.0.0.1:11434').replace(/\/$/, '');
  }

  private chatModel(): string {
    return (this.config.get<string>('ESHOP_CATALOG_CHAT_MODEL') ?? 'llama3.2').trim() || 'llama3.2';
  }

  async complete(messages: CatalogChatMessageDto[]): Promise<{ role: 'assistant'; content: string }> {
    if (!this.isChatBackendConfigured()) {
      throw new ServiceUnavailableException('Catalog chat is not configured (enable ESHOP_CATALOG_CHAT_ENABLED and ESHOP_OLLAMA_BASE_URL).');
    }

    const url = `${this.ollamaBase()}/api/chat`;
    const model = this.chatModel();

    try {
      const res = await axiosWithPolicy<OllamaChatResponse>(this.resilient, {
        url,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: {
          model,
          stream: false,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        },
      });
      const text = res.data.message?.content?.trim();
      if (!text) {
        throw new ServiceUnavailableException('Empty response from chat backend.');
      }
      return { role: 'assistant', content: text };
    } catch (e) {
      if (e instanceof ServiceUnavailableException) throw e;
      throw new ServiceUnavailableException('Chat backend request failed.');
    }
  }
}
