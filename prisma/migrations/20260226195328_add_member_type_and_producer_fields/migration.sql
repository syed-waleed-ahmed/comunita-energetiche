-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "censimpCode" TEXT,
ADD COLUMN     "hasStorage" BOOLEAN,
ADD COLUMN     "installedCapacityKW" DOUBLE PRECISION,
ADD COLUMN     "memberType" TEXT,
ADD COLUMN     "plantPowerKW" DOUBLE PRECISION;
