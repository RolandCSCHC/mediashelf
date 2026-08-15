-- AlterTable
ALTER TABLE "CustomListItem" ADD COLUMN "status" "MediaStatus" NOT NULL DEFAULT 'WATCHLIST';

UPDATE "CustomListItem" AS "cli"
SET "status" = "mi"."status"
FROM "MediaItem" AS "mi"
WHERE "cli"."mediaItemId" = "mi"."id";

-- CreateIndex
CREATE INDEX "CustomListItem_listId_status_idx" ON "CustomListItem"("listId", "status");
