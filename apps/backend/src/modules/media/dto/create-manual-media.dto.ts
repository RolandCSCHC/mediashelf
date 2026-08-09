import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MediaStatus, MediaType } from '@mediashelf/shared-types';

export class CreateManualMediaDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title!: string;

  @IsEnum(MediaType)
  type!: MediaType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1870)
  @Max(2100)
  releaseYear?: number;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  @MaxLength(4000)
  @IsOptional()
  description?: string | null;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  @MaxLength(4000)
  @IsOptional()
  notes?: string | null;

  @IsOptional()
  @IsEnum(MediaStatus)
  status?: MediaStatus;
}
