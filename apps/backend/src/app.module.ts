import { Module } from '@nestjs/common';
import { PrismaModule } from './modules/prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { TmdbModule } from './modules/tmdb/tmdb.module';

@Module({
  imports: [PrismaModule, HealthModule, AuthModule, TmdbModule],
})
export class AppModule {}
