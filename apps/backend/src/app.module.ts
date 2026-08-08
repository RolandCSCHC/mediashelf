import { Module } from '@nestjs/common';
import { PrismaModule } from './modules/prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { TmdbModule } from './modules/tmdb/tmdb.module';
import { MediaModule } from './modules/media/media.module';
import { ListsModule } from './modules/lists/lists.module';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    AuthModule,
    TmdbModule,
    MediaModule,
    ListsModule,
  ],
})
export class AppModule {}
