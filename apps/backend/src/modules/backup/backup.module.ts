import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ListsModule } from '../lists/lists.module';
import { MediaModule } from '../media/media.module';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';

@Module({
  imports: [AuthModule, MediaModule, ListsModule],
  controllers: [BackupController],
  providers: [BackupService],
})
export class BackupModule {}
