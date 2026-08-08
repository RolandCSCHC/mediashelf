import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddListItemDto {
  @IsString()
  @MinLength(1)
  mediaItemId!: string;

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
