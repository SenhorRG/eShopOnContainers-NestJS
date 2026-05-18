import { CatalogAiOrchestrator } from './catalog-ai.orchestrator';
import { NoopCatalogAiService } from './noop-catalog-ai.service';

function cfg(env: Record<string, string | undefined>) {
  return {
    get: (k: string) => env[k],
  } as import('@nestjs/config').ConfigService;
}

describe('CatalogAiOrchestrator', () => {
  it('routes to noop when ESHOP_CATALOG_EMBEDDINGS_PROVIDER=off even if Ollama flag is true', async () => {
    const noop = new NoopCatalogAiService();
    const noopSpy = jest.spyOn(noop, 'embeddingForSearchText');

    const ollama = {
      isEnabled: true,
      embeddingForSearchText: jest.fn().mockRejectedValue(new Error('ollama should not run')),
      embeddingForCatalogLine: jest.fn().mockRejectedValue(new Error('ollama should not run')),
    };
    const openai = {
      isEnabled: false,
      embeddingForSearchText: jest.fn(),
      embeddingForCatalogLine: jest.fn(),
    };
    const azure = {
      isEnabled: false,
      embeddingForSearchText: jest.fn(),
      embeddingForCatalogLine: jest.fn(),
    };

    const orch = new CatalogAiOrchestrator(
      cfg({
        ESHOP_CATALOG_EMBEDDINGS_PROVIDER: 'off',
        ESHOP_CATALOG_OLLAMA_ENABLED: 'true',
      }),
      noop,
      ollama as never,
      openai as never,
      azure as never,
    );

    await orch.embeddingForSearchText('hello');
    expect(noopSpy).toHaveBeenCalled();
    expect(ollama.embeddingForSearchText).not.toHaveBeenCalled();
    expect(orch.isEnabled).toBe(false);
  });
});
