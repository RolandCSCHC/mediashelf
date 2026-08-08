import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export enum TmdbSearchTypeDto {
  MOVIE = 'MOVIE',
  SERIES = 'SERIES',
  ALL = 'ALL',
}

export class SearchTmdbDto {
  @IsString()
  @MinLength(1)
  q!: string;

  @IsOptional()
  @IsEnum(TmdbSearchTypeDto)
  type?: TmdbSearchTypeDto = TmdbSearchTypeDto.ALL;
}
