import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { AuthGuard } from 'src/_services/guards/auth.guard';
import { CreateWorkspaceMemberDto } from './dto/create-workspace-member.dto';
import { WorkspaceMemberService } from './workspace-member.service';
import { UpdateWorkspaceMemberDto } from './dto/update-workspace-member.dto';

@Controller('workspace')
export class WorkspaceController {
  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly workspaceMemberService: WorkspaceMemberService,
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createWorkspaceDto: CreateWorkspaceDto, @Request() req) {
    return this.workspaceService.create(req?.user.id, createWorkspaceDto);
  }

  @UseGuards(AuthGuard)
  @Get()
  GetMyWorkspace(@Request() req) {
    console.log(req.user);
    return this.workspaceService.findAll(req?.user.id);
  }

  @UseGuards(AuthGuard)
  @Post('member')
  createWorkspaceMember(
    @Request() req,
    @Body() createWorkspaceMemberDto: CreateWorkspaceMemberDto,
  ) {
    return this.workspaceMemberService.addMember(
      req?.user.id,
      createWorkspaceMemberDto,
    );
  }
  
  @UseGuards(AuthGuard)
  @Get('member/:workspaceId')
  getMembers(@Request() req, @Param('workspaceId') workspaceId: string) {
    return this.workspaceMemberService.getWorkspaceMembers(workspaceId, req.user.id);
  }

  @UseGuards(AuthGuard)
  @Patch('member/:id')
  updateMember(
    @Request() req,
    @Param('id') id: string,
    @Body() updateMemberDto: UpdateWorkspaceMemberDto,
  ) {
    return this.workspaceMemberService.updateMember(req.user.id, id, updateMemberDto);
  }

  @UseGuards(AuthGuard)
  @Delete('member/:id')
  removeMember(@Request() req, @Param('id') id: string) {
    return this.workspaceMemberService.removeMember(req.user.id, id);
  }


  @UseGuards(AuthGuard)
  @Post('member/transfer-ownership')
  transferOwnership(
    @Request() req,
    @Body() body: { workspaceId: string; newOwnerId: string },
  ) {
    return this.workspaceMemberService.transferOwnership(
      req.user.id,
      body.workspaceId,
      body.newOwnerId,
    );
  }

  @UseGuards(AuthGuard)
  @Delete('member/leave/:workspaceId')
  leaveWorkspace(@Request() req, @Param('workspaceId') workspaceId: string) {
    return this.workspaceMemberService.leaveWorkspace(req.user.id, workspaceId);
  }
}
