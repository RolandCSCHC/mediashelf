import {
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateMediaItemDto {
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  @MaxLength(4000)
  @IsOptional()
  notes?: string | null;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsISO8601()
  @IsOptional()
  dateWatched?: string | null;
}
