-- Requires psql meta-commands (supported when Docker entrypoint feeds this file to psql).
\c catalogdb
CREATE EXTENSION IF NOT EXISTS vector;
