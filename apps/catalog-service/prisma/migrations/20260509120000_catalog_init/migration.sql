-- CreateExtension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable CatalogBrand
CREATE TABLE IF NOT EXISTS "CatalogBrand" (
    "Id" SERIAL NOT NULL,
    "Brand" VARCHAR(100) NOT NULL,
    CONSTRAINT "CatalogBrand_pkey" PRIMARY KEY ("Id")
);

-- CreateTable CatalogType
CREATE TABLE IF NOT EXISTS "CatalogType" (
    "Id" SERIAL NOT NULL,
    "Type" VARCHAR(100) NOT NULL,
    CONSTRAINT "CatalogType_pkey" PRIMARY KEY ("Id")
);

-- CreateTable Catalog
CREATE TABLE IF NOT EXISTS "Catalog" (
    "Id" SERIAL NOT NULL,
    "Name" VARCHAR(50) NOT NULL,
    "Description" TEXT,
    "Price" DECIMAL(18,4) NOT NULL,
    "PictureFileName" TEXT,
    "CatalogTypeId" INTEGER NOT NULL,
    "CatalogBrandId" INTEGER NOT NULL,
    "AvailableStock" INTEGER NOT NULL,
    "RestockThreshold" INTEGER NOT NULL,
    "MaxStockThreshold" INTEGER NOT NULL,
    "OnReorder" BOOLEAN NOT NULL DEFAULT false,
    "Embedding" vector(384),
    CONSTRAINT "Catalog_pkey" PRIMARY KEY ("Id")
);

-- AddForeignKey
DO $$ BEGIN
 ALTER TABLE "Catalog" ADD CONSTRAINT "Catalog_CatalogBrandId_fkey" FOREIGN KEY ("CatalogBrandId") REFERENCES "CatalogBrand"("Id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "Catalog" ADD CONSTRAINT "Catalog_CatalogTypeId_fkey" FOREIGN KEY ("CatalogTypeId") REFERENCES "CatalogType"("Id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "Catalog_Name_idx" ON "Catalog"("Name");
CREATE INDEX IF NOT EXISTS "Catalog_CatalogBrandId_idx" ON "Catalog"("CatalogBrandId");
CREATE INDEX IF NOT EXISTS "Catalog_CatalogTypeId_idx" ON "Catalog"("CatalogTypeId");

CREATE INDEX IF NOT EXISTS "idx_catalog_txt_fts"
  ON "Catalog" USING gin (to_tsvector('english', coalesce("Name", '') || ' ' || coalesce("Description", '')));

-- Outbox (catalog public schema, matches libs/outbox/sql/create_integration_event_log.catalog_public.sql)
CREATE TABLE IF NOT EXISTS public."IntegrationEventLog" (
  "EventId" uuid PRIMARY KEY NOT NULL,
  "EventTypeName" text NOT NULL,
  "State" integer NOT NULL,
  "TimesSent" integer NOT NULL,
  "CreationTime" timestamptz NOT NULL,
  "Content" text NOT NULL,
  "TransactionId" uuid NOT NULL
);
