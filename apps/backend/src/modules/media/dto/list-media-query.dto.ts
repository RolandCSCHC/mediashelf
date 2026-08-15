import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  MediaSortBy,
  MediaStatus,
  MediaType,
  PAGE_SIZE_ALL,
} from '@mediashelf/shared-types';
import { MAX_PAGE_SIZE } from '../../../common/pagination';

function toOptionalBoolean(value: unknown): unknown {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (value === true || value === 'true') {
    return true;
  }
  if (value === false || value === 'false') {
    return false;
  }
  return value;
}

export class ListMediaQueryDto {
  @IsOptional()
  @IsEnum(MediaStatus)
  status?: MediaStatus;

  @IsOptional()
  @IsEnum(MediaType)
  type?: MediaType;

  @IsOptional()
  @IsString()
  @MinLength(1)
  genre?: string;

  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  downloaded?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(1)
  listId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  search?: string;

  @IsOptional()
  @IsEnum(MediaSortBy)
  sortBy?: MediaSortBy = MediaSortBy.TITLE;

  @IsOptional()
  @Transform(({ value }) => toOptionalInt(value))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => toOptionalPageSize(value))
  @ValidateIf((_, value) => value !== PAGE_SIZE_ALL)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  pageSize?: number | typeof PAGE_SIZE_ALL;
}

function toOptionalInt(value: unknown): unknown {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : value;
}

function toOptionalPageSize(value: unknown): unknown {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value === 'string' && value.toLowerCase() === PAGE_SIZE_ALL) {
    return PAGE_SIZE_ALL;
  }
  return toOptionalInt(value);
}
