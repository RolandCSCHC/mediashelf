import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { TmdbSearchResponse } from '@mediashelf/shared-types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TmdbService } from './tmdb.service';
import { SearchTmdbDto, TmdbSearchTypeDto } from './dto/search-tmdb.dto';

@Controller('tmdb')
@UseGuards(JwtAuthGuard)
export class TmdbController {
  constructor(private readonly tmdbService: TmdbService) {}

  @Get('search')
  async search(@Query() query: SearchTmdbDto): Promise<TmdbSearchResponse> {
    const results = await this.tmdbService.search(
      query.q,
      query.type ?? TmdbSearchTypeDto.ALL,
    );

    return { results };
  }
}
