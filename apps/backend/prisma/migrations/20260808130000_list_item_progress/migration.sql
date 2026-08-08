-- AlterTable
ALTER TABLE "CustomListItem" ADD COLUMN "currentSeason" INTEGER,
ADD COLUMN "currentEpisode" INTEGER;

-- Migrate existing MediaItem progress onto list memberships
UPDATE "CustomListItem" AS cli
SET
  "currentSeason" = mi."currentSeason",
  "currentEpisode" = mi."currentEpisode"
FROM "MediaItem" AS mi
WHERE cli."mediaItemId" = mi."id"
  AND (mi."currentSeason" IS NOT NULL OR mi."currentEpisode" IS NOT NULL);

-- AlterTable
ALTER TABLE "MediaItem" DROP COLUMN "currentSeason",
DROP COLUMN "currentEpisode";
