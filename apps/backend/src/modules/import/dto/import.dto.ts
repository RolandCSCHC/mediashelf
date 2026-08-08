import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { MediaStatus, MediaType } from '@mediashelf/shared-types';

export class ImportPreviewDto {
  @IsString()
  @MaxLength(500_000)
  text!: string;
}

export class ImportConfirmEntryDto {
  @IsInt()
  @Min(1)
  tmdbId!: number;

  @IsEnum(MediaType)
  type!: MediaType;

  @IsEnum(MediaStatus)
  status!: MediaStatus;

  @IsBoolean()
  downloaded!: boolean;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  @MaxLength(4000)
  @IsOptional()
  notes?: string | null;
}

export class ImportConfirmDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ImportConfirmEntryDto)
  items!: ImportConfirmEntryDto[];
}
