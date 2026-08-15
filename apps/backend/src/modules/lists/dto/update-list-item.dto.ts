import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MediaStatus } from '@mediashelf/shared-types';

export class UpdateListItemDto {
  @IsOptional()
  @IsEnum(MediaStatus)
  status?: MediaStatus;

  @IsOptional()
  @IsBoolean()
  downloaded?: boolean;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  currentSeason?: number | null;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  currentEpisode?: number | null;
}
