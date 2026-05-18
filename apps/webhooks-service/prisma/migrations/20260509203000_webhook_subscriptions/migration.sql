-- CreateTable
CREATE TABLE "webhooks"."subscriptions" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" INTEGER NOT NULL,
    "dest_url" TEXT NOT NULL,
    "token" TEXT,
    "date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "webhooks"."subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_type_idx" ON "webhooks"."subscriptions"("type");
