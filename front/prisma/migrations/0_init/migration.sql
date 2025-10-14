-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."BookingStatus" AS ENUM ('CONFIRMADO', 'COMPLETADO', 'CANCELADO', 'PENDIENTE');

-- CreateEnum
CREATE TYPE "public"."DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('USER', 'MANAGER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."SubscriptionCycle" AS ENUM ('MENSUAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "public"."SubscriptionPlan" AS ENUM ('FREE', 'BASE', 'ESTANDAR', 'FULL');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('EN_PRUEBA', 'ACTIVA', 'ATRASADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Amenity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,

    CONSTRAINT "Amenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Booking" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL DEFAULT 0,
    "totalPrice" INTEGER NOT NULL,
    "depositAmount" INTEGER NOT NULL,
    "depositPaid" INTEGER NOT NULL,
    "remainingBalance" INTEGER NOT NULL,
    "status" "public"."BookingStatus" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "courtId" TEXT NOT NULL,
    "userId" TEXT,
    "guestName" TEXT,
    "guestPhone" TEXT,
    "refundPending" BOOLEAN NOT NULL DEFAULT false,
    "paymentId" TEXT,
    "couponId" TEXT,
    "hasReview" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Complex" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "openHour" INTEGER,
    "closeHour" INTEGER,
    "courtCount" INTEGER,
    "timeSlotInterval" INTEGER NOT NULL DEFAULT 30,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "instagramHandle" TEXT,
    "facebookUrl" TEXT,
    "cancellationPolicyHours" INTEGER NOT NULL DEFAULT 24,
    "mp_access_token" TEXT,
    "mp_refresh_token" TEXT,
    "mp_public_key" TEXT,
    "mp_user_id" TEXT,
    "mp_connected_at" TIMESTAMP(3),
    "subscriptionPlan" "public"."SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "subscriptionStatus" "public"."SubscriptionStatus" NOT NULL DEFAULT 'EN_PRUEBA',
    "subscriptionCycle" "public"."SubscriptionCycle",
    "trialEndsAt" TIMESTAMP(3),
    "subscribedAt" TIMESTAMP(3),
    "currentPeriodEndsAt" TIMESTAMP(3),
    "mp_subscription_id" TEXT,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "inscriptionRequestId" TEXT,

    CONSTRAINT "Complex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Coupon" (
    "id" TEXT NOT NULL,
    "complexId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discountType" "public"."DiscountType" NOT NULL,
    "discountValue" INTEGER NOT NULL,
    "validUntil" TIMESTAMP(3),
    "maxUses" INTEGER,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Court" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sportId" TEXT NOT NULL DEFAULT 'cmfsf71vz0000i02g5a2vvvgd',
    "slotDurationMinutes" INTEGER NOT NULL DEFAULT 60,
    "complexId" TEXT NOT NULL,

    CONSTRAINT "Court_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Image" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "complexId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InscriptionRequest" (
    "id" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerPhone" TEXT NOT NULL,
    "ownerEmail" TEXT NOT NULL,
    "complexName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "sports" TEXT NOT NULL,
    "selectedPlan" TEXT NOT NULL,
    "selectedCycle" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InscriptionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PasswordResetToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PriceRule" (
    "id" TEXT NOT NULL,
    "startTime" INTEGER NOT NULL,
    "endTime" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "depositAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "courtId" TEXT NOT NULL,

    CONSTRAINT "PriceRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Review" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "complexId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Schedule" (
    "id" TEXT NOT NULL,
    "mondayOpen" INTEGER,
    "mondayClose" INTEGER,
    "tuesdayOpen" INTEGER,
    "tuesdayClose" INTEGER,
    "wednesdayOpen" INTEGER,
    "wednesdayClose" INTEGER,
    "thursdayOpen" INTEGER,
    "thursdayClose" INTEGER,
    "fridayOpen" INTEGER,
    "fridayClose" INTEGER,
    "saturdayOpen" INTEGER,
    "saturdayClose" INTEGER,
    "sundayOpen" INTEGER,
    "sundayClose" INTEGER,
    "complexId" TEXT NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Sport" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,

    CONSTRAINT "Sport_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "public"."Role" NOT NULL DEFAULT 'USER',
    "hashedPassword" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "image" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_AmenityToComplex" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AmenityToComplex_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider" ASC, "providerAccountId" ASC);

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "public"."Account"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Amenity_slug_key" ON "public"."Amenity"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_courtId_date_startTime_key" ON "public"."Booking"("courtId" ASC, "date" ASC, "startTime" ASC);

-- CreateIndex
CREATE INDEX "Booking_courtId_idx" ON "public"."Booking"("courtId" ASC);

-- CreateIndex
CREATE INDEX "Booking_date_idx" ON "public"."Booking"("date" ASC);

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "public"."Booking"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Complex_inscriptionRequestId_key" ON "public"."Complex"("inscriptionRequestId" ASC);

-- CreateIndex
CREATE INDEX "Complex_managerId_idx" ON "public"."Complex"("managerId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Complex_managerId_key" ON "public"."Complex"("managerId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Complex_mp_subscription_id_key" ON "public"."Complex"("mp_subscription_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Complex_slug_key" ON "public"."Complex"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_complexId_code_key" ON "public"."Coupon"("complexId" ASC, "code" ASC);

-- CreateIndex
CREATE INDEX "Coupon_complexId_idx" ON "public"."Coupon"("complexId" ASC);

-- CreateIndex
CREATE INDEX "Court_complexId_idx" ON "public"."Court"("complexId" ASC);

-- CreateIndex
CREATE INDEX "Court_sportId_idx" ON "public"."Court"("sportId" ASC);

-- CreateIndex
CREATE INDEX "Image_complexId_idx" ON "public"."Image"("complexId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "public"."PasswordResetToken"("token" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_userId_key" ON "public"."PasswordResetToken"("userId" ASC);

-- CreateIndex
CREATE INDEX "PriceRule_courtId_idx" ON "public"."PriceRule"("courtId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_key" ON "public"."Review"("bookingId" ASC);

-- CreateIndex
CREATE INDEX "Review_complexId_idx" ON "public"."Review"("complexId" ASC);

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "public"."Review"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_complexId_key" ON "public"."Schedule"("complexId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Sport_slug_key" ON "public"."Sport"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlanDetails_mp_plan_id_key" ON "public"."SubscriptionPlanDetails"("mp_plan_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "public"."User"("phone" ASC);

-- CreateIndex
CREATE INDEX "_AmenityToComplex_B_index" ON "public"."_AmenityToComplex"("B" ASC);

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "public"."Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "public"."Court"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Complex" ADD CONSTRAINT "Complex_inscriptionRequestId_fkey" FOREIGN KEY ("inscriptionRequestId") REFERENCES "public"."InscriptionRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Complex" ADD CONSTRAINT "Complex_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Coupon" ADD CONSTRAINT "Coupon_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "public"."Complex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Court" ADD CONSTRAINT "Court_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "public"."Complex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Court" ADD CONSTRAINT "Court_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "public"."Sport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Image" ADD CONSTRAINT "Image_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "public"."Complex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PriceRule" ADD CONSTRAINT "PriceRule_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "public"."Court"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "public"."Complex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Schedule" ADD CONSTRAINT "Schedule_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "public"."Complex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AmenityToComplex" ADD CONSTRAINT "_AmenityToComplex_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Amenity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AmenityToComplex" ADD CONSTRAINT "_AmenityToComplex_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Complex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

