import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type {
  AuthUser,
  LibraryBackupImportResponse,
  LibraryBackupPayload,
} from '@mediashelf/shared-types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BackupService } from './backup.service';
import { ImportLibraryBackupDto } from './dto/import-library-backup.dto';
import {
  LibraryBackupImportResponseSchema,
  LibraryBackupPayloadSchema,
} from '../../swagger/api-schemas';

@ApiTags('Backup')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid auth cookie' })
@Controller('backup')
@UseGuards(JwtAuthGuard)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get()
  @ApiOperation({ summary: 'Export library as JSON backup' })
  @ApiOkResponse({ type: LibraryBackupPayloadSchema })
  exportLibrary(@CurrentUser() user: AuthUser): Promise<LibraryBackupPayload> {
    return this.backupService.exportForUser(user.id);
  }

  @Post('import')
  @ApiOperation({
    summary: 'Merge-import a library backup',
    description:
      'Imports media and lists from a previously exported JSON backup, skipping duplicates where possible.',
  })
  @ApiOkResponse({ type: LibraryBackupImportResponseSchema })
  importLibrary(
    @CurrentUser() user: AuthUser,
    @Body() body: ImportLibraryBackupDto,
  ): Promise<LibraryBackupImportResponse> {
    return this.backupService.importForUser(user.id, body);
  }
}
