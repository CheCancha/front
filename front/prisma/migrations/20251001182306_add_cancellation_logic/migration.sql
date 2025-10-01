-- AlterTable
ALTER TABLE "public"."Booking" ADD COLUMN     "guestPhone" TEXT,
ADD COLUMN     "refundPending" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Complex" ADD COLUMN     "cancellationPolicyHours" INTEGER NOT NULL DEFAULT 24;
