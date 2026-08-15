import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
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
import { MoveListItemDto } from './dto/move-list-item.dto';
import { ListMediaQueryDto } from '../media/dto/list-media-query.dto';
import {
  CustomListDetailSchema,
  CustomListEntrySchema,
  CustomListSchema,
  MediaListMembershipSchema,
} from '../../swagger/api-schemas';

@ApiTags('Lists')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid auth cookie' })
@Controller('lists')
@UseGuards(JwtAuthGuard)
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Get()
  @ApiOperation({ summary: 'List custom lists' })
  @ApiOkResponse({ type: [CustomListSchema] })
  list(@CurrentUser() user: AuthUser): Promise<CustomList[]> {
    return this.listsService.listForUser(user.id);
  }

  @Get('for-media/:mediaItemId')
  @ApiOperation({ summary: 'List memberships for a media item' })
  @ApiParam({ name: 'mediaItemId', description: 'Media item id' })
  @ApiOkResponse({ type: [MediaListMembershipSchema] })
  membershipsForMedia(
    @CurrentUser() user: AuthUser,
    @Param('mediaItemId') mediaItemId: string,
  ): Promise<MediaListMembership[]> {
    return this.listsService.membershipsForMedia(user.id, mediaItemId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a custom list with items' })
  @ApiParam({ name: 'id', description: 'List id' })
  @ApiOkResponse({ type: CustomListDetailSchema })
  getOne(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query() query: ListMediaQueryDto,
  ): Promise<CustomListDetail> {
    return this.listsService.getForUser(user.id, id, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a custom list' })
  @ApiCreatedResponse({ type: CustomListSchema })
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateCustomListDto,
  ): Promise<CustomList> {
    return this.listsService.createForUser(user.id, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a custom list' })
  @ApiParam({ name: 'id', description: 'List id' })
  @ApiOkResponse({ type: CustomListSchema })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateCustomListDto,
  ): Promise<CustomList> {
    return this.listsService.updateForUser(user.id, id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a custom list' })
  @ApiParam({ name: 'id', description: 'List id' })
  @ApiNoContentResponse()
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.listsService.deleteForUser(user.id, id);
  }

  @Post(':id/items/bulk')
  @ApiOperation({ summary: 'Add multiple media items to a list' })
  @ApiParam({ name: 'id', description: 'List id' })
  @ApiOkResponse({ type: CustomListDetailSchema })
  addItems(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: AddListItemsDto,
  ): Promise<CustomListDetail> {
    return this.listsService.addItemsForUser(user.id, id, body);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Add one media item to a list' })
  @ApiParam({ name: 'id', description: 'List id' })
  @ApiOkResponse({ type: CustomListDetailSchema })
  addItem(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: AddListItemDto,
  ): Promise<CustomListDetail> {
    return this.listsService.addItemForUser(user.id, id, body);
  }

  @Patch(':id/items/:mediaItemId')
  @ApiOperation({ summary: 'Update series progress on a list entry' })
  @ApiParam({ name: 'id', description: 'List id' })
  @ApiParam({ name: 'mediaItemId', description: 'Media item id' })
  @ApiOkResponse({ type: CustomListEntrySchema })
  updateItem(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('mediaItemId') mediaItemId: string,
    @Body() body: UpdateListItemDto,
  ): Promise<CustomListEntry> {
    return this.listsService.updateItemForUser(user.id, id, mediaItemId, body);
  }

  @Post(':id/items/:mediaItemId/move')
  @ApiOperation({
    summary: 'Move a media item to another list, preserving series progress',
  })
  @ApiParam({ name: 'id', description: 'Source list id' })
  @ApiParam({ name: 'mediaItemId', description: 'Media item id' })
  @ApiOkResponse({ type: [MediaListMembershipSchema] })
  moveItem(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('mediaItemId') mediaItemId: string,
    @Body() body: MoveListItemDto,
  ): Promise<MediaListMembership[]> {
    return this.listsService.moveItemForUser(user.id, id, mediaItemId, body);
  }

  @Delete(':id/items/:mediaItemId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove a media item from a list' })
  @ApiParam({ name: 'id', description: 'List id' })
  @ApiParam({ name: 'mediaItemId', description: 'Media item id' })
  @ApiNoContentResponse()
  async removeItem(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('mediaItemId') mediaItemId: string,
  ): Promise<void> {
    await this.listsService.removeItemForUser(user.id, id, mediaItemId);
  }
}
