import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TmdbController } from './tmdb.controller';
import { TmdbService } from './tmdb.service';

@Module({
  imports: [AuthModule],
  controllers: [TmdbController],
  providers: [TmdbService],
  exports: [TmdbService],
})
export class TmdbModule {}
