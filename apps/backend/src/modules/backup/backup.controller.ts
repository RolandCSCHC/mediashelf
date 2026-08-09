import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import type {
  AuthUser,
  LibraryBackupImportResponse,
  LibraryBackupPayload,
} from '@mediashelf/shared-types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BackupService } from './backup.service';
import { ImportLibraryBackupDto } from './dto/import-library-backup.dto';

@Controller('backup')
@UseGuards(JwtAuthGuard)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get()
  exportLibrary(
    @CurrentUser() user: AuthUser,
  ): Promise<LibraryBackupPayload> {
    return this.backupService.exportForUser(user.id);
  }

  @Post('import')
  importLibrary(
    @CurrentUser() user: AuthUser,
    @Body() body: ImportLibraryBackupDto,
  ): Promise<LibraryBackupImportResponse> {
    return this.backupService.importForUser(user.id, body);
  }
}
