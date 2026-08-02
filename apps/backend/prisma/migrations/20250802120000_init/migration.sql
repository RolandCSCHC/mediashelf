-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('MOVIE', 'SERIES');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('WATCHLIST', 'WATCHING', 'WATCHED', 'FUTURE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "googleId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "picture" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "type" "MediaType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "posterPath" TEXT,
    "backdropPath" TEXT,
    "releaseDate" TIMESTAMP(3),
    "genres" TEXT[],
    "runtime" INTEGER,
    "status" "MediaStatus" NOT NULL DEFAULT 'WATCHLIST',
    "downloaded" BOOLEAN NOT NULL DEFAULT false,
    "currentSeason" INTEGER,
    "currentEpisode" INTEGER,
    "dateWatched" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "MediaItem_userId_status_idx" ON "MediaItem"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MediaItem_userId_tmdbId_type_key" ON "MediaItem"("userId", "tmdbId", "type");

-- AddForeignKey
ALTER TABLE "MediaItem" ADD CONSTRAINT "MediaItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
