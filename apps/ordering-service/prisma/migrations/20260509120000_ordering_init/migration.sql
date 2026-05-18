-- Ordering schema + tables aligned with Ordering.Infrastructure EF snapshots (HiLo sequences omitted; plain SERIAL / identity).
CREATE SCHEMA IF NOT EXISTS ordering;

CREATE TABLE IF NOT EXISTS ordering."cardtypes" (
  "Id" integer NOT NULL PRIMARY KEY,
  "Name" character varying(200) NOT NULL
);

CREATE TABLE IF NOT EXISTS ordering."buyers" (
  "Id" serial NOT NULL PRIMARY KEY,
  "IdentityGuid" character varying(200) NOT NULL,
  "Name" text NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_buyers_IdentityGuid"
  ON ordering."buyers" ("IdentityGuid");

CREATE TABLE IF NOT EXISTS ordering."paymentmethods" (
  "Id" serial NOT NULL PRIMARY KEY,
  "BuyerId" integer NOT NULL REFERENCES ordering."buyers" ("Id") ON DELETE CASCADE,
  "Alias" character varying(200) NOT NULL,
  "CardHolderName" character varying(200) NOT NULL,
  "CardNumber" character varying(25) NOT NULL,
  "Expiration" timestamptz NOT NULL,
  "CardTypeId" integer NOT NULL REFERENCES ordering."cardtypes" ("Id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IX_paymentmethods_BuyerId" ON ordering."paymentmethods" ("BuyerId");
CREATE INDEX IF NOT EXISTS "IX_paymentmethods_CardTypeId" ON ordering."paymentmethods" ("CardTypeId");

CREATE TABLE IF NOT EXISTS ordering."orders" (
  "Id" serial NOT NULL PRIMARY KEY,
  "BuyerId" integer NULL REFERENCES ordering."buyers" ("Id"),
  "PaymentMethodId" integer NULL REFERENCES ordering."paymentmethods" ("Id") ON DELETE RESTRICT,
  "OrderDate" timestamptz NOT NULL,
  "OrderStatus" character varying(30) NOT NULL,
  "Description" text NULL,
  "Street" text NULL,
  "City" text NULL,
  "State" text NULL,
  "Country" text NULL,
  "ZipCode" text NULL
);

CREATE INDEX IF NOT EXISTS "IX_orders_BuyerId" ON ordering."orders" ("BuyerId");
CREATE INDEX IF NOT EXISTS "IX_orders_PaymentMethodId" ON ordering."orders" ("PaymentMethodId");

CREATE TABLE IF NOT EXISTS ordering."orderItems" (
  "Id" serial NOT NULL PRIMARY KEY,
  "OrderId" integer NOT NULL REFERENCES ordering."orders" ("Id") ON DELETE CASCADE,
  "ProductId" integer NOT NULL,
  "Discount" numeric(18,4) NOT NULL,
  "PictureUrl" text NULL,
  "ProductName" text NOT NULL,
  "UnitPrice" numeric(18,4) NOT NULL,
  "Units" integer NOT NULL
);

CREATE INDEX IF NOT EXISTS "IX_orderItems_OrderId" ON ordering."orderItems" ("OrderId");

CREATE TABLE IF NOT EXISTS ordering."requests" (
  "Id" uuid NOT NULL PRIMARY KEY,
  "Name" text NOT NULL,
  "Time" timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS ordering."IntegrationEventLog" (
  "EventId" uuid PRIMARY KEY NOT NULL,
  "EventTypeName" text NOT NULL,
  "State" integer NOT NULL,
  "TimesSent" integer NOT NULL,
  "CreationTime" timestamptz NOT NULL,
  "Content" text NOT NULL,
  "TransactionId" uuid NOT NULL
);
