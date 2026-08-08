import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type {
  AuthUser,
  CustomList,
  CustomListDetail,
  CustomListEntry,
  MediaListMembership,
} from '@mediashelf/shared-types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ListsService } from './lists.service';
import { CreateCustomListDto } from './dto/create-custom-list.dto';
import { UpdateCustomListDto } from './dto/update-custom-list.dto';
import { AddListItemDto } from './dto/add-list-item.dto';
import { AddListItemsDto } from './dto/add-list-items.dto';
import { UpdateListItemDto } from './dto/update-list-item.dto';

@Controller('lists')
@UseGuards(JwtAuthGuard)
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<CustomList[]> {
    return this.listsService.listForUser(user.id);
  }

  @Get('for-media/:mediaItemId')
  membershipsForMedia(
    @CurrentUser() user: AuthUser,
    @Param('mediaItemId') mediaItemId: string,
  ): Promise<MediaListMembership[]> {
    return this.listsService.membershipsForMedia(user.id, mediaItemId);
  }

  @Get(':id')
  getOne(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<CustomListDetail> {
    return this.listsService.getForUser(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateCustomListDto,
  ): Promise<CustomList> {
    return this.listsService.createForUser(user.id, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateCustomListDto,
  ): Promise<CustomList> {
    return this.listsService.updateForUser(user.id, id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.listsService.deleteForUser(user.id, id);
  }

  @Post(':id/items/bulk')
  addItems(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: AddListItemsDto,
  ): Promise<CustomListDetail> {
    return this.listsService.addItemsForUser(user.id, id, body);
  }

  @Post(':id/items')
  addItem(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: AddListItemDto,
  ): Promise<CustomListDetail> {
    return this.listsService.addItemForUser(user.id, id, body);
  }

  @Patch(':id/items/:mediaItemId')
  updateItem(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('mediaItemId') mediaItemId: string,
    @Body() body: UpdateListItemDto,
  ): Promise<CustomListEntry> {
    return this.listsService.updateItemForUser(user.id, id, mediaItemId, body);
  }

  @Delete(':id/items/:mediaItemId')
  @HttpCode(204)
  async removeItem(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('mediaItemId') mediaItemId: string,
  ): Promise<void> {
    await this.listsService.removeItemForUser(user.id, id, mediaItemId);
  }
}
