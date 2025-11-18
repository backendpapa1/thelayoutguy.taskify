import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WorkspaceListService } from './workspace-list.service';
import { CreateWorkspaceListDto } from './dto/create-workspace-list.dto';
import { UpdateWorkspaceListDto } from './dto/update-workspace-list.dto';

@Controller('workspace-list')
export class WorkspaceListController {
  constructor(private readonly workspaceListService: WorkspaceListService) {}

  @Post()
  create(@Body() createWorkspaceListDto: CreateWorkspaceListDto) {
    return this.workspaceListService.create(createWorkspaceListDto);
  }

  @Get()
  findAll() {
    return this.workspaceListService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workspaceListService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWorkspaceListDto: UpdateWorkspaceListDto) {
    return this.workspaceListService.update(+id, updateWorkspaceListDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workspaceListService.remove(+id);
  }
}
