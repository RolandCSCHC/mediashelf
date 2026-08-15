import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  LIBRARY_BACKUP_VERSION,
  MediaStatus,
  MediaType,
} from '@mediashelf/shared-types';

export class LibraryBackupMediaItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  ref!: string;

  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(1)
  tmdbId!: number | null;

  @IsEnum(MediaType)
  type!: MediaType;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title!: string;

  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(8000)
  description!: string | null;

  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(500)
  posterPath!: string | null;

  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(500)
  backdropPath!: string | null;

  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(40)
  releaseDate!: string | null;

  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  genres!: string[];

  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(0)
  runtime!: number | null;

  @IsEnum(MediaStatus)
  status!: MediaStatus;

  @IsBoolean()
  downloaded!: boolean;

  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(4000)
  notes!: string | null;

  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(40)
  dateWatched!: string | null;
}

export class LibraryBackupListItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  mediaRef!: string;

  @IsOptional()
  @IsEnum(MediaStatus)
  status?: MediaStatus;

  @IsOptional()
  @IsBoolean()
  downloaded?: boolean;

  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(0)
  currentSeason!: number | null;

  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(0)
  currentEpisode!: number | null;
}

export class LibraryBackupListDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(2000)
  description!: string | null;

  @IsOptional()
  @IsEnum(MediaStatus)
  defaultStatus?: MediaStatus | null;

  @IsOptional()
  @IsBoolean()
  defaultDownloaded?: boolean | null;

  @IsArray()
  @ArrayMaxSize(2000)
  @ValidateNested({ each: true })
  @Type(() => LibraryBackupListItemDto)
  items!: LibraryBackupListItemDto[];
}

export class ImportLibraryBackupDto {
  @IsInt()
  @IsIn([LIBRARY_BACKUP_VERSION])
  version!: typeof LIBRARY_BACKUP_VERSION;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  exportedAt?: string;

  @IsArray()
  @ArrayMaxSize(5000)
  @ValidateNested({ each: true })
  @Type(() => LibraryBackupMediaItemDto)
  media!: LibraryBackupMediaItemDto[];

  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => LibraryBackupListDto)
  lists!: LibraryBackupListDto[];
}
