/*
  Warnings:

  - You are about to drop the column `slotDurationMinutes` on the `Complex` table. All the data in the column will be lost.
  - You are about to drop the column `sport` on the `Court` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Booking" ADD COLUMN     "startMinute" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."Complex" DROP COLUMN "slotDurationMinutes";

-- AlterTable
ALTER TABLE "public"."Court" DROP COLUMN "sport",
ADD COLUMN     "slotDurationMinutes" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "sportId" TEXT NOT NULL DEFAULT 'clyza1b2c0001d4v6e8fghijk';

-- DropEnum
DROP TYPE "public"."Sport";

-- CreateTable
CREATE TABLE "public"."Sport" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,

    CONSTRAINT "Sport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sport_slug_key" ON "public"."Sport"("slug");

-- AddForeignKey
ALTER TABLE "public"."Court" ADD CONSTRAINT "Court_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "public"."Sport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
