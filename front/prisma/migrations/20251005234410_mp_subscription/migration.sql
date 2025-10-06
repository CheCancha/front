/*
  Warnings:

  - A unique constraint covering the columns `[mp_subscription_id]` on the table `Complex` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('EN_PRUEBA', 'ACTIVA', 'ATRASADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "public"."SubscriptionCycle" AS ENUM ('MENSUAL', 'ANUAL');

-- AlterTable
ALTER TABLE "public"."Complex" ADD COLUMN     "currentPeriodEndsAt" TIMESTAMP(3),
ADD COLUMN     "mp_subscription_id" TEXT,
ADD COLUMN     "subscribedAt" TIMESTAMP(3),
ADD COLUMN     "subscriptionCycle" "public"."SubscriptionCycle",
ADD COLUMN     "subscriptionStatus" "public"."SubscriptionStatus" NOT NULL DEFAULT 'EN_PRUEBA',
ADD COLUMN     "trialEndsAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."InscriptionRequest" ADD COLUMN     "selectedCycle" TEXT;

-- CreateTable
CREATE TABLE "public"."SubscriptionPlanDetails" (
    "id" TEXT NOT NULL,
    "plan" "public"."SubscriptionPlan" NOT NULL,
    "cycle" "public"."SubscriptionCycle" NOT NULL,
    "price" INTEGER NOT NULL,
    "mp_plan_id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionPlanDetails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlanDetails_mp_plan_id_key" ON "public"."SubscriptionPlanDetails"("mp_plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "Complex_mp_subscription_id_key" ON "public"."Complex"("mp_subscription_id");
