-- CreateEnum
CREATE TYPE "public"."SubscriptionPlan" AS ENUM ('FREE', 'BASE', 'ESTANDAR', 'FULL');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('EN_PRUEBA', 'ACTIVA', 'ATRASADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "public"."SubscriptionCycle" AS ENUM ('MENSUAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "public"."DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('USER', 'MANAGER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."BookingStatus" AS ENUM ('CONFIRMADO', 'COMPLETADO', 'CANCELADO', 'PENDIENTE');

-- CreateEnum
CREATE TYPE "public"."FixedSlotType" AS ENUM ('CLIENTE_FIJO', 'ENTRENAMIENTO', 'MANTENIMIENTO');

-- CreateEnum
CREATE TYPE "public"."BookingPaymentStatus" AS ENUM ('PENDIENTE', 'PAGADO');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('ONLINE', 'EFECTIVO', 'TRANSFERENCIA', 'OTRO');

-- CreateEnum
CREATE TYPE "public"."CashRegisterStatus" AS ENUM ('ABIERTA', 'CERRADA');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('INGRESO', 'EGRESO');

-- CreateEnum
CREATE TYPE "public"."TransactionSource" AS ENUM ('RESERVA', 'VENTA_PRODUCTO', 'GASTO', 'AJUSTE_INICIAL', 'AJUSTE_MANUAL', 'OTRO');

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
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "url" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
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
    "oneSignalPlayerId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "public"."Complex" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "openHour" TEXT,
    "closeHour" TEXT,
    "courtCount" INTEGER,
    "timeSlotInterval" INTEGER NOT NULL DEFAULT 30,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "contactEmail" TEXT,
    "instagramHandle" TEXT,
    "facebookUrl" TEXT,
    "cancellationPolicyHours" INTEGER NOT NULL DEFAULT 24,
    "mp_access_token" TEXT,
    "mp_refresh_token" TEXT,
    "mp_public_key" TEXT,
    "mp_user_id" TEXT,
    "mp_connected_at" TIMESTAMP(3),
    "inscriptionRequestId" TEXT,
    "subscriptionPlan" "public"."SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "subscriptionStatus" "public"."SubscriptionStatus" NOT NULL DEFAULT 'EN_PRUEBA',
    "subscriptionCycle" "public"."SubscriptionCycle",
    "trialEndsAt" TIMESTAMP(3),
    "subscribedAt" TIMESTAMP(3),
    "currentPeriodEndsAt" TIMESTAMP(3),
    "mp_subscription_id" TEXT,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Complex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContactPhone" (
    "id" TEXT NOT NULL,
    "complexId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "label" TEXT,

    CONSTRAINT "ContactPhone_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "public"."Sport" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,

    CONSTRAINT "Sport_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "public"."BlockedSlot" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "reason" TEXT,
    "courtId" TEXT NOT NULL,
    "complexId" TEXT NOT NULL,

    CONSTRAINT "BlockedSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FixedSlot" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "complexId" TEXT NOT NULL,
    "notes" TEXT,
    "price" INTEGER NOT NULL DEFAULT 0,
    "type" "public"."FixedSlotType" NOT NULL DEFAULT 'CLIENTE_FIJO',

    CONSTRAINT "FixedSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Schedule" (
    "id" TEXT NOT NULL,
    "mondayOpen" TEXT,
    "mondayClose" TEXT,
    "tuesdayOpen" TEXT,
    "tuesdayClose" TEXT,
    "wednesdayOpen" TEXT,
    "wednesdayClose" TEXT,
    "thursdayOpen" TEXT,
    "thursdayClose" TEXT,
    "fridayOpen" TEXT,
    "fridayClose" TEXT,
    "saturdayOpen" TEXT,
    "saturdayClose" TEXT,
    "sundayOpen" TEXT,
    "sundayClose" TEXT,
    "complexId" TEXT NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
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
    "totalPaid" INTEGER NOT NULL DEFAULT 0,
    "remainingBalance" INTEGER NOT NULL,
    "status" "public"."BookingStatus" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "courtId" TEXT NOT NULL,
    "userId" TEXT,
    "guestName" TEXT,
    "guestPhone" TEXT,
    "refundPending" BOOLEAN NOT NULL DEFAULT false,
    "paymentId" TEXT,
    "hasReview" BOOLEAN NOT NULL DEFAULT false,
    "couponId" TEXT,
    "fixedSlotId" TEXT,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "paymentMethod" "public"."PaymentMethod",

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CashRegisterSession" (
    "id" TEXT NOT NULL,
    "complexId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "status" "public"."CashRegisterStatus" NOT NULL DEFAULT 'ABIERTA',
    "openingBalance" INTEGER NOT NULL,
    "closingBalance" INTEGER,
    "expectedBalance" INTEGER,
    "difference" INTEGER,
    "notes" TEXT,

    CONSTRAINT "CashRegisterSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Transaction" (
    "id" TEXT NOT NULL,
    "complexId" TEXT NOT NULL,
    "cashRegisterSessionId" TEXT,
    "type" "public"."TransactionType" NOT NULL,
    "source" "public"."TransactionSource" NOT NULL,
    "paymentMethod" "public"."PaymentMethod" NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bookingPlayerId" TEXT,
    "saleId" TEXT,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BookingPlayer" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "userId" TEXT,
    "guestName" TEXT,
    "paymentStatus" "public"."BookingPaymentStatus" NOT NULL DEFAULT 'PENDIENTE',
    "amountPaid" INTEGER NOT NULL DEFAULT 0,
    "paymentMethod" "public"."PaymentMethod",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "complexId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "stock" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" TEXT,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductCategory" (
    "id" TEXT NOT NULL,
    "complexId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Sale" (
    "id" TEXT NOT NULL,
    "complexId" TEXT NOT NULL,
    "userId" TEXT,
    "totalAmount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "public"."_AmenityToComplex" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AmenityToComplex_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlanDetails_mp_plan_id_key" ON "public"."SubscriptionPlanDetails"("mp_plan_id");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "public"."Notification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "public"."User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_oneSignalPlayerId_key" ON "public"."User"("oneSignalPlayerId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "public"."PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_userId_key" ON "public"."PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "public"."Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_key" ON "public"."Review"("bookingId");

-- CreateIndex
CREATE INDEX "Review_complexId_idx" ON "public"."Review"("complexId");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "public"."Review"("userId");

-- CreateIndex
CREATE INDEX "Coupon_complexId_idx" ON "public"."Coupon"("complexId");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_complexId_code_key" ON "public"."Coupon"("complexId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Complex_slug_key" ON "public"."Complex"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Complex_managerId_key" ON "public"."Complex"("managerId");

-- CreateIndex
CREATE UNIQUE INDEX "Complex_inscriptionRequestId_key" ON "public"."Complex"("inscriptionRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Complex_mp_subscription_id_key" ON "public"."Complex"("mp_subscription_id");

-- CreateIndex
CREATE INDEX "Complex_managerId_idx" ON "public"."Complex"("managerId");

-- CreateIndex
CREATE INDEX "ContactPhone_complexId_idx" ON "public"."ContactPhone"("complexId");

-- CreateIndex
CREATE UNIQUE INDEX "Amenity_slug_key" ON "public"."Amenity"("slug");

-- CreateIndex
CREATE INDEX "Image_complexId_idx" ON "public"."Image"("complexId");

-- CreateIndex
CREATE UNIQUE INDEX "Sport_slug_key" ON "public"."Sport"("slug");

-- CreateIndex
CREATE INDEX "Court_complexId_idx" ON "public"."Court"("complexId");

-- CreateIndex
CREATE INDEX "Court_sportId_idx" ON "public"."Court"("sportId");

-- CreateIndex
CREATE INDEX "BlockedSlot_courtId_date_idx" ON "public"."BlockedSlot"("courtId", "date");

-- CreateIndex
CREATE INDEX "FixedSlot_courtId_idx" ON "public"."FixedSlot"("courtId");

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_complexId_key" ON "public"."Schedule"("complexId");

-- CreateIndex
CREATE INDEX "Booking_fixedSlotId_idx" ON "public"."Booking"("fixedSlotId");

-- CreateIndex
CREATE INDEX "Booking_courtId_idx" ON "public"."Booking"("courtId");

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "public"."Booking"("userId");

-- CreateIndex
CREATE INDEX "Booking_date_idx" ON "public"."Booking"("date");

-- CreateIndex
CREATE INDEX "CashRegisterSession_complexId_idx" ON "public"."CashRegisterSession"("complexId");

-- CreateIndex
CREATE INDEX "CashRegisterSession_managerId_idx" ON "public"."CashRegisterSession"("managerId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_saleId_key" ON "public"."Transaction"("saleId");

-- CreateIndex
CREATE INDEX "Transaction_complexId_idx" ON "public"."Transaction"("complexId");

-- CreateIndex
CREATE INDEX "Transaction_cashRegisterSessionId_idx" ON "public"."Transaction"("cashRegisterSessionId");

-- CreateIndex
CREATE INDEX "BookingPlayer_bookingId_idx" ON "public"."BookingPlayer"("bookingId");

-- CreateIndex
CREATE INDEX "BookingPlayer_userId_idx" ON "public"."BookingPlayer"("userId");

-- CreateIndex
CREATE INDEX "Product_complexId_idx" ON "public"."Product"("complexId");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "public"."Product"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_complexId_name_key" ON "public"."ProductCategory"("complexId", "name");

-- CreateIndex
CREATE INDEX "Sale_complexId_idx" ON "public"."Sale"("complexId");

-- CreateIndex
CREATE INDEX "Sale_userId_idx" ON "public"."Sale"("userId");

-- CreateIndex
CREATE INDEX "SaleItem_saleId_idx" ON "public"."SaleItem"("saleId");

-- CreateIndex
CREATE INDEX "SaleItem_productId_idx" ON "public"."SaleItem"("productId");

-- CreateIndex
CREATE INDEX "PriceRule_courtId_idx" ON "public"."PriceRule"("courtId");

-- CreateIndex
CREATE INDEX "_AmenityToComplex_B_index" ON "public"."_AmenityToComplex"("B");

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "public"."Complex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Coupon" ADD CONSTRAINT "Coupon_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "public"."Complex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Complex" ADD CONSTRAINT "Complex_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Complex" ADD CONSTRAINT "Complex_inscriptionRequestId_fkey" FOREIGN KEY ("inscriptionRequestId") REFERENCES "public"."InscriptionRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContactPhone" ADD CONSTRAINT "ContactPhone_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "public"."Complex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Image" ADD CONSTRAINT "Image_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "public"."Complex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Court" ADD CONSTRAINT "Court_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "public"."Sport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Court" ADD CONSTRAINT "Court_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "public"."Complex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BlockedSlot" ADD CONSTRAINT "BlockedSlot_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "public"."Court"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BlockedSlot" ADD CONSTRAINT "BlockedSlot_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "public"."Complex"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FixedSlot" ADD CONSTRAINT "FixedSlot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FixedSlot" ADD CONSTRAINT "FixedSlot_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "public"."Court"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FixedSlot" ADD CONSTRAINT "FixedSlot_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "public"."Complex"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Schedule" ADD CONSTRAINT "Schedule_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "public"."Complex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "public"."Court"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "public"."Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_fixedSlotId_fkey" FOREIGN KEY ("fixedSlotId") REFERENCES "public"."FixedSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CashRegisterSession" ADD CONSTRAINT "CashRegisterSession_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "public"."Complex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CashRegisterSession" ADD CONSTRAINT "CashRegisterSession_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "public"."Complex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_cashRegisterSessionId_fkey" FOREIGN KEY ("cashRegisterSessionId") REFERENCES "public"."CashRegisterSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_bookingPlayerId_fkey" FOREIGN KEY ("bookingPlayerId") REFERENCES "public"."BookingPlayer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "public"."Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingPlayer" ADD CONSTRAINT "BookingPlayer_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingPlayer" ADD CONSTRAINT "BookingPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "public"."Complex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductCategory" ADD CONSTRAINT "ProductCategory_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "public"."Complex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "public"."Complex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "public"."Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PriceRule" ADD CONSTRAINT "PriceRule_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "public"."Court"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AmenityToComplex" ADD CONSTRAINT "_AmenityToComplex_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Amenity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AmenityToComplex" ADD CONSTRAINT "_AmenityToComplex_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Complex"("id") ON DELETE CASCADE ON UPDATE CASCADE;
