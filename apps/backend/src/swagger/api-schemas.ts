import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  MediaStatus,
  MediaType,
  LIBRARY_BACKUP_VERSION,
} from '@mediashelf/shared-types';

export class AuthUserSchema {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  name!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  picture!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class LogoutResponseSchema {
  @ApiProperty({ example: true })
  success!: true;
}

export class HealthResponseSchema {
  @ApiProperty({ enum: ['ok', 'error'] })
  status!: 'ok' | 'error';

  @ApiProperty({ enum: ['up', 'down'] })
  database!: 'up' | 'down';
}

export class MediaItemSchema {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiPropertyOptional({ nullable: true, type: Number })
  tmdbId!: number | null;

  @ApiProperty({ enum: MediaType })
  type!: MediaType;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  description!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  posterPath!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  backdropPath!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  releaseDate!: string | null;

  @ApiProperty({ type: [String] })
  genres!: string[];

  @ApiPropertyOptional({ nullable: true, type: Number })
  runtime!: number | null;

  @ApiProperty({ enum: MediaStatus })
  status!: MediaStatus;

  @ApiProperty()
  downloaded!: boolean;

  @ApiPropertyOptional({ nullable: true, type: String })
  notes!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  dateWatched!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class TmdbSearchResultSchema {
  @ApiProperty()
  tmdbId!: number;

  @ApiProperty({ enum: MediaType })
  type!: MediaType;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  overview!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  posterPath!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  releaseDate!: string | null;

  @ApiProperty()
  popularity!: number;
}

export class TmdbSearchResponseSchema {
  @ApiProperty({ type: [TmdbSearchResultSchema] })
  results!: TmdbSearchResultSchema[];
}

export class CustomListSchema {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  description!: string | null;

  @ApiPropertyOptional({ enum: MediaStatus, nullable: true })
  defaultStatus!: MediaStatus | null;

  @ApiPropertyOptional({ nullable: true, type: Boolean })
  defaultDownloaded!: boolean | null;

  @ApiProperty()
  itemCount!: number;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class CustomListEntrySchema {
  @ApiProperty()
  listId!: string;

  @ApiProperty()
  mediaItemId!: string;

  @ApiProperty({ enum: MediaStatus })
  status!: MediaStatus;

  @ApiProperty()
  downloaded!: boolean;

  @ApiPropertyOptional({ nullable: true, type: Number })
  currentSeason!: number | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  currentEpisode!: number | null;

  @ApiProperty()
  addedAt!: string;

  @ApiProperty({ type: MediaItemSchema })
  mediaItem!: MediaItemSchema;
}

export class CustomListDetailSchema extends CustomListSchema {
  @ApiProperty({ type: [CustomListEntrySchema] })
  items!: CustomListEntrySchema[];

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;

  @ApiProperty({ type: [String] })
  genres!: string[];

  @ApiProperty({ type: [String] })
  itemIds!: string[];
}

export class PaginatedMediaResponseSchema {
  @ApiProperty({ type: [MediaItemSchema] })
  items!: MediaItemSchema[];

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;

  @ApiProperty({ type: [String] })
  genres!: string[];
}

export class MediaListMembershipSchema {
  @ApiProperty()
  listId!: string;

  @ApiProperty()
  listName!: string;

  @ApiProperty({ enum: MediaStatus })
  status!: MediaStatus;

  @ApiProperty()
  downloaded!: boolean;

  @ApiPropertyOptional({ nullable: true, type: Number })
  currentSeason!: number | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  currentEpisode!: number | null;

  @ApiProperty()
  addedAt!: string;
}

export class LibraryBackupMediaItemSchema {
  @ApiProperty()
  ref!: string;

  @ApiPropertyOptional({ nullable: true, type: Number })
  tmdbId!: number | null;

  @ApiProperty({ enum: MediaType })
  type!: MediaType;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  description!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  posterPath!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  backdropPath!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  releaseDate!: string | null;

  @ApiProperty({ type: [String] })
  genres!: string[];

  @ApiPropertyOptional({ nullable: true, type: Number })
  runtime!: number | null;

  @ApiProperty({ enum: MediaStatus })
  status!: MediaStatus;

  @ApiProperty()
  downloaded!: boolean;

  @ApiPropertyOptional({ nullable: true, type: String })
  notes!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  dateWatched!: string | null;
}

export class LibraryBackupListItemSchema {
  @ApiProperty()
  mediaRef!: string;

  @ApiPropertyOptional({ enum: MediaStatus })
  status?: MediaStatus;

  @ApiPropertyOptional()
  downloaded?: boolean;

  @ApiPropertyOptional({ nullable: true, type: Number })
  currentSeason!: number | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  currentEpisode!: number | null;
}

export class LibraryBackupListSchema {
  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  description!: string | null;

  @ApiPropertyOptional({ enum: MediaStatus, nullable: true })
  defaultStatus?: MediaStatus | null;

  @ApiPropertyOptional({ nullable: true, type: Boolean })
  defaultDownloaded?: boolean | null;

  @ApiProperty({ type: [LibraryBackupListItemSchema] })
  items!: LibraryBackupListItemSchema[];
}

export class LibraryBackupPayloadSchema {
  @ApiProperty({ enum: [LIBRARY_BACKUP_VERSION] })
  version!: typeof LIBRARY_BACKUP_VERSION;

  @ApiProperty()
  exportedAt!: string;

  @ApiProperty({ type: [LibraryBackupMediaItemSchema] })
  media!: LibraryBackupMediaItemSchema[];

  @ApiProperty({ type: [LibraryBackupListSchema] })
  lists!: LibraryBackupListSchema[];
}

export class LibraryBackupImportResponseSchema {
  @ApiProperty()
  mediaImported!: number;

  @ApiProperty()
  mediaSkipped!: number;

  @ApiProperty()
  listsCreated!: number;

  @ApiProperty()
  listsReused!: number;

  @ApiProperty()
  membershipsAdded!: number;

  @ApiProperty()
  membershipsSkipped!: number;

  @ApiProperty()
  errorCount!: number;

  @ApiProperty({ type: [String] })
  errors!: string[];
}
