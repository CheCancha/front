/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Complex` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Complex" ADD COLUMN     "slug" TEXT;

-- CreateTable
CREATE TABLE "public"."Amenity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,

    CONSTRAINT "Amenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_AmenityToComplex" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AmenityToComplex_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Amenity_slug_key" ON "public"."Amenity"("slug");

-- CreateIndex
CREATE INDEX "_AmenityToComplex_B_index" ON "public"."_AmenityToComplex"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Complex_slug_key" ON "public"."Complex"("slug");

-- AddForeignKey
ALTER TABLE "public"."_AmenityToComplex" ADD CONSTRAINT "_AmenityToComplex_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Amenity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AmenityToComplex" ADD CONSTRAINT "_AmenityToComplex_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Complex"("id") ON DELETE CASCADE ON UPDATE CASCADE;
