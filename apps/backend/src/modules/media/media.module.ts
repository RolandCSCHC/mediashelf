import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TmdbModule } from '../tmdb/tmdb.module';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaRepository } from './media.repository';

@Module({
  imports: [AuthModule, TmdbModule],
  controllers: [MediaController],
  providers: [MediaService, MediaRepository],
  exports: [MediaService],
})
export class MediaModule {}
