-- DropIndex
DROP INDEX "MediaItem_userId_status_idx";

-- AlterTable
ALTER TABLE "MediaItem" DROP COLUMN "downloaded",
DROP COLUMN "status";

-- CreateIndex
CREATE INDEX "MediaItem_userId_idx" ON "MediaItem"("userId");
