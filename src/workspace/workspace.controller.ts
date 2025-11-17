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
  Query,
} from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto, UpdateWorkspaceIconDto } from './dto/update-workspace.dto';
import { AuthGuard } from 'src/_services/guards/auth.guard';
import { CreateWorkspaceMemberDto } from './dto/create-workspace-member.dto';
import { WorkspaceMemberService } from './workspace-member.service';
import { UpdateWorkspaceMemberDto } from './dto/update-workspace-member.dto';
import { PaginationDto } from './dto/paginated-workspace.dto';

@Controller('workspace')
export class WorkspaceController {
  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly workspaceMemberService: WorkspaceMemberService,
  ) {}

  @UseGuards(AuthGuard)
  @Post('')
  create(@Body() createWorkspaceDto: CreateWorkspaceDto, @Request() req) {
    return this.workspaceService.create(req?.user.id, createWorkspaceDto);
  }

  @UseGuards(AuthGuard)
  @Get('')
  GetMyWorkspace(@Request() req) {
    console.log(req.user);
    return this.workspaceService.findAll(req?.user.id);
  }

  @UseGuards(AuthGuard)
  @Patch('member/:id')
  updateMember(
    @Request() req,
    @Param('id') id: string,
    @Body() updateMemberDto: UpdateWorkspaceMemberDto,
  ) {
    return this.workspaceMemberService.updateMember(
      req.user.id,
      id,
      updateMemberDto,
    );
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

  @UseGuards(AuthGuard)
  @Get('member/my-workspaces')
  getMyWorkspaces(@Request() req, @Query() paginationDto: PaginationDto) {
    return this.workspaceService.findAllForUser(req.user.id, paginationDto);
  }

  @UseGuards(AuthGuard)
  @Get('member/my-invitations')
  getMyInvitations(@Request() req, @Query() paginationDto: PaginationDto) {
    return this.workspaceService.getPendingInvitations(
      req.user.id,
      paginationDto,
    );
  }

  @UseGuards(AuthGuard)
  @Post('member/invite')
  inviteMember(
    @Request() req,
    @Body() createMemberDto: CreateWorkspaceMemberDto,
  ) {
    return this.workspaceMemberService.inviteMember(
      req.user.id,
      createMemberDto,
    );
  }

  @UseGuards(AuthGuard)
  @Post('member/accept/:workspaceId')
  acceptInvitation(@Request() req, @Param('workspaceId') workspaceId: string) {
    return this.workspaceMemberService.acceptInvitation(
      req.user.id,
      workspaceId,
    );
  }

  @UseGuards(AuthGuard)
  @Delete('member/decline/:workspaceId')
  declineInvitation(@Request() req, @Param('workspaceId') workspaceId: string) {
    return this.workspaceMemberService.declineInvitation(
      req.user.id,
      workspaceId,
    );
  }

  @UseGuards(AuthGuard)
  @Get('member/workspace/:workspaceId')
  getMembers(
    @Request() req,
    @Param('workspaceId') workspaceId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.workspaceMemberService.getWorkspaceMembers(
      workspaceId,
      req.user.id,
      paginationDto,
    );
  }

  @UseGuards(AuthGuard)
  @Get('member/:workspaceId/invitations')
  getWorkspaceInvitations(
    @Request() req,
    @Param('workspaceId') workspaceId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.workspaceMemberService.getWorkspaceInvitations(
      workspaceId,
      req.user.id,
      paginationDto,
    );
  }

  @UseGuards(AuthGuard)
  @Delete('member/invitation/:id')
  cancelInvitation(@Request() req, @Param('id') id: string) {
    return this.workspaceMemberService.cancelInvitation(req.user.id, id);
  }


  @UseGuards(AuthGuard)
  @Patch(':id/icon')
  updateWorkspaceIcon(
    @Request() req,
    @Param('id') id: string,
    @Body() updateIconDto: UpdateWorkspaceIconDto,
  ) {
    return this.workspaceService.updateWorkspaceIcon(
      req.user.id,
      id,
      updateIconDto,
    );
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  updateWorkspace(
    @Request() req,
    @Param('id') id: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    return this.workspaceService.updateWorkspace(
      req.user.id,
      id,
      updateWorkspaceDto,
    );
  }

}
