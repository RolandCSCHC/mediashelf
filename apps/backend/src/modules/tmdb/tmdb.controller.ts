import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type {
  TmdbSearchResponse,
  TmdbTitleDetails,
} from '@mediashelf/shared-types';
import { MediaType } from '@mediashelf/shared-types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TmdbService } from './tmdb.service';
import { SearchTmdbDto, TmdbSearchTypeDto } from './dto/search-tmdb.dto';
import { TmdbTitleParamsDto } from './dto/tmdb-title-params.dto';
import {
  TmdbSearchResponseSchema,
  TmdbTitleDetailsSchema,
} from '../../swagger/api-schemas';

@ApiTags('TMDB')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid auth cookie' })
@Controller('tmdb')
@UseGuards(JwtAuthGuard)
export class TmdbController {
  constructor(private readonly tmdbService: TmdbService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search movies and TV series on TMDB' })
  @ApiOkResponse({ type: TmdbSearchResponseSchema })
  async search(@Query() query: SearchTmdbDto): Promise<TmdbSearchResponse> {
    const results = await this.tmdbService.search(
      query.q,
      query.type ?? TmdbSearchTypeDto.ALL,
    );

    return { results };
  }

  @Get(':type/:tmdbId')
  @ApiOperation({
    summary: 'Get TMDB title details and credits before importing',
  })
  @ApiParam({ name: 'type', enum: MediaType })
  @ApiParam({ name: 'tmdbId', type: Number })
  @ApiOkResponse({ type: TmdbTitleDetailsSchema })
  @ApiNotFoundResponse({ description: 'TMDB title not found' })
  getTitle(@Param() params: TmdbTitleParamsDto): Promise<TmdbTitleDetails> {
    return this.tmdbService.getTitleDetails(params.tmdbId, params.type);
  }
}
