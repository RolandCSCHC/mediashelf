import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';
import { ListsController } from './lists.controller';
import { ListsService } from './lists.service';
import { ListsRepository } from './lists.repository';

@Module({
  imports: [AuthModule, MediaModule],
  controllers: [ListsController],
  providers: [ListsService, ListsRepository],
})
export class ListsModule {}
