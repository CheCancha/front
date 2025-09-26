-- DropForeignKey
ALTER TABLE "public"."Booking" DROP CONSTRAINT "Booking_courtId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Court" DROP CONSTRAINT "Court_complexId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Image" DROP CONSTRAINT "Image_complexId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Schedule" DROP CONSTRAINT "Schedule_complexId_fkey";

-- AlterTable
ALTER TABLE "public"."Complex" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "public"."Account"("userId");

-- CreateIndex
CREATE INDEX "Booking_courtId_idx" ON "public"."Booking"("courtId");

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "public"."Booking"("userId");

-- CreateIndex
CREATE INDEX "Booking_date_idx" ON "public"."Booking"("date");

-- CreateIndex
CREATE INDEX "Complex_managerId_idx" ON "public"."Complex"("managerId");

-- CreateIndex
CREATE INDEX "Court_complexId_idx" ON "public"."Court"("complexId");

-- CreateIndex
CREATE INDEX "Court_sportId_idx" ON "public"."Court"("sportId");

-- CreateIndex
CREATE INDEX "Image_complexId_idx" ON "public"."Image"("complexId");

-- CreateIndex
CREATE INDEX "PriceRule_courtId_idx" ON "public"."PriceRule"("courtId");

-- AddForeignKey
ALTER TABLE "public"."Image" ADD CONSTRAINT "Image_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "public"."Complex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Court" ADD CONSTRAINT "Court_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "public"."Complex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Schedule" ADD CONSTRAINT "Schedule_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "public"."Complex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "public"."Court"("id") ON DELETE CASCADE ON UPDATE CASCADE;
