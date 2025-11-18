import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards } from '@nestjs/common';
import { WorkspaceListService } from './workspace-list.service';
import { CreateWorkspaceListDto } from './dto/create-workspace-list.dto';
import { UpdateWorkspaceListDto } from './dto/update-workspace-list.dto';
import { ReorderListsDto } from './dto/reorder-lists.dto';
import { AuthGuard } from '../_services/guards/auth.guard';

@Controller('workspace-list')
export class WorkspaceListController {
  constructor(private readonly workspaceListService: WorkspaceListService) {}

  @UseGuards(AuthGuard)
  @Post('')
  createList(@Request() req, @Body() createListDto: CreateWorkspaceListDto) {
    return this.workspaceListService.createList(req.user.id, createListDto);
  }

  @UseGuards(AuthGuard)
  @Get('workspace/:workspaceId')
  getWorkspaceLists(
    @Request() req,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.workspaceListService.getWorkspaceLists(req.user.id, workspaceId);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  getListById(@Request() req, @Param('id') id: string) {
    return this.workspaceListService.getListById(req.user.id, id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  updateList(
    @Request() req,
    @Param('id') id: string,
    @Body() updateListDto: UpdateWorkspaceListDto,
  ) {
    return this.workspaceListService.updateList(req.user.id, id, updateListDto);
  }

  @UseGuards(AuthGuard)
  @Patch('workspace/:workspaceId/reorder')
  reorderLists(
    @Request() req,
    @Param('workspaceId') workspaceId: string,
    @Body() reorderDto: ReorderListsDto,
  ) {
    return this.workspaceListService.reorderLists(req.user.id, workspaceId, reorderDto);
  }


  @UseGuards(AuthGuard)
  @Delete(':id')
  deleteList(@Request() req, @Param('id') id: string) {
    return this.workspaceListService.deleteList(req.user.id, id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/toggle-archive')
  toggleArchive(@Request() req, @Param('id') id: string) {
    return this.workspaceListService.toggleListArchive(req.user.id, id);
  }

  @UseGuards(AuthGuard)
  @Post(':id/duplicate')
  duplicateList(@Request() req, @Param('id') id: string) {
    return this.workspaceListService.duplicateList(req.user.id, id);
  }
}
