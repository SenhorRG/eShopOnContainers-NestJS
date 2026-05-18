CREATE TABLE "IdentityUsers" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdentityUsers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IdentityUsers_email_key" ON "IdentityUsers"("email");
