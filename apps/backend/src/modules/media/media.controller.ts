import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { AuthUser, MediaItem } from '@mediashelf/shared-types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MediaService } from './media.service';
import { ImportMediaDto } from './dto/import-media.dto';
import { UpdateMediaItemDto } from './dto/update-media-item.dto';
import { ListMediaQueryDto } from './dto/list-media-query.dto';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: ListMediaQueryDto,
  ): Promise<MediaItem[]> {
    return this.mediaService.listForUser(user.id, query);
  }

  @Get(':id')
  getOne(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<MediaItem> {
    return this.mediaService.getForUser(user.id, id);
  }

  @Post()
  importMedia(
    @CurrentUser() user: AuthUser,
    @Body() body: ImportMediaDto,
  ): Promise<MediaItem> {
    return this.mediaService.importFromTmdb(user.id, body.tmdbId, body.type);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateMediaItemDto,
  ): Promise<MediaItem> {
    return this.mediaService.updateForUser(user.id, id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.mediaService.deleteForUser(user.id, id);
  }
}
