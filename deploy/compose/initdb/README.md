Execution order follows lexicographic file names:

1. `01-create-databases.sql` — creates `catalogdb`, `identitydb`, `orderingdb`, `webhooksdb`.  
2. `02-extensions-catalog.sql` — connects to `catalogdb` and enables `vector` (pgvector).

Verify pgvector after a clean volume:

```bash
docker compose -f docker-compose.yml --env-file .env.compose.example exec postgres \
  psql -U postgres -d catalogdb -c "SELECT extname FROM pg_extension WHERE extname = 'vector';"
```
