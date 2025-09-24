/*
  Warnings:

  - You are about to drop the column `depositAmount` on the `Court` table. All the data in the column will be lost.
  - You are about to drop the column `pricePerHour` on the `Court` table. All the data in the column will be lost.
  - Added the required column `depositAmount` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Booking" ADD COLUMN     "depositAmount" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."Court" DROP COLUMN "depositAmount",
DROP COLUMN "pricePerHour";

-- CreateTable
CREATE TABLE "public"."PriceRule" (
    "id" TEXT NOT NULL,
    "startTime" INTEGER NOT NULL,
    "endTime" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "depositPercentage" INTEGER NOT NULL DEFAULT 30,
    "courtId" TEXT NOT NULL,

    CONSTRAINT "PriceRule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."PriceRule" ADD CONSTRAINT "PriceRule_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "public"."Court"("id") ON DELETE CASCADE ON UPDATE CASCADE;
