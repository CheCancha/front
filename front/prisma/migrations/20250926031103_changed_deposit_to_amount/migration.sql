/*
  Warnings:

  - You are about to drop the column `depositPercentage` on the `PriceRule` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."PriceRule" DROP COLUMN "depositPercentage",
ADD COLUMN     "depositAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
