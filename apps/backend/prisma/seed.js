const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'demo@mediashelf.local' },
    update: {},
    create: {
      googleId: 'demo-google-id',
      email: 'demo@mediashelf.local',
      name: 'Demo User',
      picture: null,
    },
  });

  await prisma.mediaItem.upsert({
    where: {
      userId_tmdbId_type: {
        userId: user.id,
        tmdbId: 122,
        type: 'MOVIE',
      },
    },
    update: {},
    create: {
      userId: user.id,
      tmdbId: 122,
      type: 'MOVIE',
      title: 'The Lord of the Rings: The Return of the King',
      description:
        "Aragorn is revealed as the heir to the ancient kings as he, Gandalf and the other members of the remaining fellowship struggle to save Gondor from Sauron's forces.",
      posterPath: '/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg',
      backdropPath: '/2u7zbn8EudG6kLlBzUYqP8RyFU4.jpg',
      releaseDate: new Date('2003-12-17'),
      genres: ['Adventure', 'Fantasy', 'Action'],
      runtime: 201,
      status: 'WATCHED',
      downloaded: true,
      dateWatched: new Date('2024-01-15'),
    },
  });

  await prisma.mediaItem.upsert({
    where: {
      userId_tmdbId_type: {
        userId: user.id,
        tmdbId: 1396,
        type: 'SERIES',
      },
    },
    update: {},
    create: {
      userId: user.id,
      tmdbId: 1396,
      type: 'SERIES',
      title: 'Breaking Bad',
      description:
        "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine in order to secure his family's future.",
      posterPath: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
      backdropPath: '/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
      releaseDate: new Date('2008-01-20'),
      genres: ['Drama', 'Crime'],
      runtime: 45,
      status: 'WATCHING',
      downloaded: false,
      currentSeason: 3,
      currentEpisode: 5,
    },
  });

  console.log('Seed complete:', { userId: user.id });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
