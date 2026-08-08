import { IsInt, IsOptional, Min, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateListItemDto {
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
