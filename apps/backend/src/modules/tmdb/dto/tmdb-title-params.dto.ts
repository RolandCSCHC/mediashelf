import { IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MediaType } from '@mediashelf/shared-types';

export class TmdbTitleParamsDto {
  @IsEnum(MediaType)
  type!: MediaType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  tmdbId!: number;
}
