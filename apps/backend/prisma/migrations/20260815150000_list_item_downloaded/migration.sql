-- AlterTable
ALTER TABLE "CustomListItem" ADD COLUMN "downloaded" BOOLEAN NOT NULL DEFAULT false;

UPDATE "CustomListItem" AS "cli"
SET "downloaded" = "mi"."downloaded"
FROM "MediaItem" AS "mi"
WHERE "cli"."mediaItemId" = "mi"."id";

-- CreateIndex
CREATE INDEX "CustomListItem_listId_downloaded_idx" ON "CustomListItem"("listId", "downloaded");
