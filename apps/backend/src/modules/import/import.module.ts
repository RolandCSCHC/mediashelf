import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';
import { TmdbModule } from '../tmdb/tmdb.module';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';

@Module({
  imports: [AuthModule, MediaModule, TmdbModule],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
