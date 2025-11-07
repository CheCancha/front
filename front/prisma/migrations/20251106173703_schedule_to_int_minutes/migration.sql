/*
  Warnings:

  - The `mondayOpen` column on the `Schedule` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `mondayClose` column on the `Schedule` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `tuesdayOpen` column on the `Schedule` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `tuesdayClose` column on the `Schedule` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `wednesdayOpen` column on the `Schedule` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `wednesdayClose` column on the `Schedule` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `thursdayOpen` column on the `Schedule` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `thursdayClose` column on the `Schedule` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `fridayOpen` column on the `Schedule` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `fridayClose` column on the `Schedule` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `saturdayOpen` column on the `Schedule` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `saturdayClose` column on the `Schedule` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `sundayOpen` column on the `Schedule` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `sundayClose` column on the `Schedule` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Schedule" DROP COLUMN "mondayOpen",
ADD COLUMN     "mondayOpen" INTEGER,
DROP COLUMN "mondayClose",
ADD COLUMN     "mondayClose" INTEGER,
DROP COLUMN "tuesdayOpen",
ADD COLUMN     "tuesdayOpen" INTEGER,
DROP COLUMN "tuesdayClose",
ADD COLUMN     "tuesdayClose" INTEGER,
DROP COLUMN "wednesdayOpen",
ADD COLUMN     "wednesdayOpen" INTEGER,
DROP COLUMN "wednesdayClose",
ADD COLUMN     "wednesdayClose" INTEGER,
DROP COLUMN "thursdayOpen",
ADD COLUMN     "thursdayOpen" INTEGER,
DROP COLUMN "thursdayClose",
ADD COLUMN     "thursdayClose" INTEGER,
DROP COLUMN "fridayOpen",
ADD COLUMN     "fridayOpen" INTEGER,
DROP COLUMN "fridayClose",
ADD COLUMN     "fridayClose" INTEGER,
DROP COLUMN "saturdayOpen",
ADD COLUMN     "saturdayOpen" INTEGER,
DROP COLUMN "saturdayClose",
ADD COLUMN     "saturdayClose" INTEGER,
DROP COLUMN "sundayOpen",
ADD COLUMN     "sundayOpen" INTEGER,
DROP COLUMN "sundayClose",
ADD COLUMN     "sundayClose" INTEGER;
