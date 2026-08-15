import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MediaStatus } from '@mediashelf/shared-types';

export class CreateCustomListDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  description?: string | null;

  @IsOptional()
  @IsEnum(MediaStatus)
  defaultStatus?: MediaStatus | null;

  @IsOptional()
  @IsBoolean()
  defaultDownloaded?: boolean | null;
}
