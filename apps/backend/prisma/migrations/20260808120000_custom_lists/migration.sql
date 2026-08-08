-- CreateTable
CREATE TABLE "CustomList" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomListItem" (
    "listId" TEXT NOT NULL,
    "mediaItemId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomListItem_pkey" PRIMARY KEY ("listId","mediaItemId")
);

-- CreateIndex
CREATE INDEX "CustomList_userId_idx" ON "CustomList"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomList_userId_name_key" ON "CustomList"("userId", "name");

-- CreateIndex
CREATE INDEX "CustomListItem_mediaItemId_idx" ON "CustomListItem"("mediaItemId");

-- AddForeignKey
ALTER TABLE "CustomList" ADD CONSTRAINT "CustomList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomListItem" ADD CONSTRAINT "CustomListItem_listId_fkey" FOREIGN KEY ("listId") REFERENCES "CustomList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomListItem" ADD CONSTRAINT "CustomListItem_mediaItemId_fkey" FOREIGN KEY ("mediaItemId") REFERENCES "MediaItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
