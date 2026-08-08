import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsOptional,
  ValidateIf,
} from 'class-validator';
import { MediaStatus } from '@mediashelf/shared-types';

export class UpdateMediaItemDto {
  @IsOptional()
  @IsEnum(MediaStatus)
  status?: MediaStatus;

  @IsOptional()
  @IsBoolean()
  downloaded?: boolean;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsISO8601()
  @IsOptional()
  dateWatched?: string | null;
}
