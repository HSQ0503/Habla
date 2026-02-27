-- CreateEnum
CREATE TYPE "ImageScope" AS ENUM ('GLOBAL', 'CLASS');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "creatorId" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "scope" "ImageScope" NOT NULL DEFAULT 'GLOBAL';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
