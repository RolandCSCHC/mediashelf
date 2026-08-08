import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import type { AuthUser, MediaItem } from '@mediashelf/shared-types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MediaService } from './media.service';
import { ImportMediaDto } from './dto/import-media.dto';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<MediaItem[]> {
    return this.mediaService.listForUser(user.id);
  }

  @Post()
  importMedia(
    @CurrentUser() user: AuthUser,
    @Body() body: ImportMediaDto,
  ): Promise<MediaItem> {
    return this.mediaService.importFromTmdb(user.id, body.tmdbId, body.type);
  }
}
