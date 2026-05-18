# Compose CI profile

Paths are relative to **`deploy/compose/`**.

| File | Role |
|------|------|
| `docker-compose.ci.yml` | Merge override that pins host ports expected in automation (`55432`, `56379`, `55672`, …). |
| `.env.ci.example` | Sets `COMPOSE_PROJECT_NAME=eshop-nestjs`, `ESHOP_USE_HTTP_ENDPOINTS=1`, `ESHOP_CATALOG_EMBEDDINGS_PROVIDER=off` unless a job opts in. |

## Catalog embeddings flags

| `ESHOP_CATALOG_EMBEDDINGS_PROVIDER` | Behaviour |
|-------------------------------------|-----------|
| `off` | No outbound embedding HTTP; semantic extras degrade cleanly. |
| `auto` | Legacy precedence chain (feature flags → Ollama toggle → vendor keys → noop). |
| `openai` | Needs `ESHOP_OPENAI_EMBEDDINGS_*`. |
| `ollama` | Needs `ESHOP_CATALOG_OLLAMA_ENABLED=true` plus URL/model. |
| `azureOpenAi` | Needs `ESHOP_AZURE_OPENAI_EMBEDDINGS_URL` and key material. |

Document new providers beside `apps/catalog-service` env samples when you widen CI matrices.

```bash
docker compose -f docker-compose.yml -f docker-compose.ci.yml --env-file .env.ci.example --profile infra-only up -d
```

Processes on the CI host continue to honour per-app `ESHOP_*_DATABASE_URL`; map container hosts to **`127.0.0.1`** and the forwarded ports above when tests reuse Compose networking.
