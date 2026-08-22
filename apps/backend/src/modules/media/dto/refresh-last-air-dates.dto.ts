import {
  ArrayMaxSize,
  IsArray,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { REFRESH_LAST_AIR_DATES_MAX } from '@mediashelf/shared-types';

export class RefreshLastAirDatesDto {
  @IsArray()
  @ArrayMaxSize(REFRESH_LAST_AIR_DATES_MAX)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(64, { each: true })
  mediaItemIds!: string[];
}
