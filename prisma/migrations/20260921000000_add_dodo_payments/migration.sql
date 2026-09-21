-- CreateEnum
CREATE TYPE "PaymentPlanType" AS ENUM ('MONTHLY', 'ANNUAL');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "proExpiresAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "payment_logs" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "customerId" TEXT,
    "customerEmail" TEXT,
    "productId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "paymentId" TEXT NOT NULL,
    "planType" "PaymentPlanType" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "amount" DECIMAL(65,30),
    "currency" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "renewsAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "payment_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_logs_paymentId_key" ON "payment_logs"("paymentId");

-- CreateIndex
CREATE INDEX "payment_logs_userId_idx" ON "payment_logs"("userId");

-- CreateIndex
CREATE INDEX "payment_logs_subscriptionId_idx" ON "payment_logs"("subscriptionId");

-- AddForeignKey
ALTER TABLE "payment_logs" ADD CONSTRAINT "payment_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
