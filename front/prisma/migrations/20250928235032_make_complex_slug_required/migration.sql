/*
  Warnings:

  - Made the column `slug` on table `Complex` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Complex" ALTER COLUMN "slug" SET NOT NULL;
