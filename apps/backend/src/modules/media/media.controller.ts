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
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type {
  AuthUser,
  MediaItem,
  PaginatedMediaResponse,
} from '@mediashelf/shared-types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MediaService } from './media.service';
import { CreateManualMediaDto } from './dto/create-manual-media.dto';
import { ImportMediaDto } from './dto/import-media.dto';
import { UpdateMediaItemDto } from './dto/update-media-item.dto';
import { ListMediaQueryDto } from './dto/list-media-query.dto';
import {
  MediaItemSchema,
  PaginatedMediaResponseSchema,
} from '../../swagger/api-schemas';

@ApiTags('Media')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid auth cookie' })
@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  @ApiOperation({
    summary: 'List library items (filter, search, sort, paginate)',
  })
  @ApiOkResponse({ type: PaginatedMediaResponseSchema })
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: ListMediaQueryDto,
  ): Promise<PaginatedMediaResponse> {
    return this.mediaService.listPageForUser(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one library item' })
  @ApiParam({ name: 'id', description: 'Media item id' })
  @ApiOkResponse({ type: MediaItemSchema })
  getOne(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<MediaItem> {
    return this.mediaService.getForUser(user.id, id);
  }

  @Post('manual')
  @ApiOperation({ summary: 'Create a manual library item (no TMDB match)' })
  @ApiCreatedResponse({ type: MediaItemSchema })
  createManual(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateManualMediaDto,
  ): Promise<MediaItem> {
    return this.mediaService.createManual(user.id, body);
  }

  @Post()
  @ApiOperation({ summary: 'Import a movie or series from TMDB' })
  @ApiCreatedResponse({ type: MediaItemSchema })
  importMedia(
    @CurrentUser() user: AuthUser,
    @Body() body: ImportMediaDto,
  ): Promise<MediaItem> {
    return this.mediaService.importFromTmdb(user.id, body.tmdbId, body.type);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update status, downloaded flag, notes, or date watched',
  })
  @ApiParam({ name: 'id', description: 'Media item id' })
  @ApiOkResponse({ type: MediaItemSchema })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateMediaItemDto,
  ): Promise<MediaItem> {
    return this.mediaService.updateForUser(user.id, id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a library item' })
  @ApiParam({ name: 'id', description: 'Media item id' })
  @ApiNoContentResponse()
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.mediaService.deleteForUser(user.id, id);
  }
}
