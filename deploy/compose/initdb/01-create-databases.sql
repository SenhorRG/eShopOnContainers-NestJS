-- Runs once against the default postgres database on first cluster init (empty volume).
-- Service databases for catalog, identity, ordering, and webhooks.
CREATE DATABASE catalogdb;
CREATE DATABASE identitydb;
CREATE DATABASE orderingdb;
CREATE DATABASE webhooksdb;
