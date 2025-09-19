-- CreateEnum
CREATE TYPE "public"."SubscriptionPlan" AS ENUM ('BASE', 'ESTANDAR', 'FULL', 'FREE');

-- AlterTable
ALTER TABLE "public"."Complex" ADD COLUMN     "subscriptionPlan" "public"."SubscriptionPlan" NOT NULL DEFAULT 'FREE';
