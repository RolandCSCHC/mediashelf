import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { TmdbSearchResponse } from '@mediashelf/shared-types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TmdbService } from './tmdb.service';
import { SearchTmdbDto, TmdbSearchTypeDto } from './dto/search-tmdb.dto';
import { TmdbSearchResponseSchema } from '../../swagger/api-schemas';

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
}
