import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import type {
  AuthUser,
  ImportConfirmResponse,
  ImportPreviewResponse,
} from '@mediashelf/shared-types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ImportService } from './import.service';
import { ImportConfirmDto, ImportPreviewDto } from './dto/import.dto';

@Controller('import')
@UseGuards(JwtAuthGuard)
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('preview')
  preview(
    @CurrentUser() user: AuthUser,
    @Body() body: ImportPreviewDto,
  ): Promise<ImportPreviewResponse> {
    return this.importService.preview(user.id, body.text);
  }

  @Post('confirm')
  confirm(
    @CurrentUser() user: AuthUser,
    @Body() body: ImportConfirmDto,
  ): Promise<ImportConfirmResponse> {
    return this.importService.confirm(user.id, body.items);
  }
}
