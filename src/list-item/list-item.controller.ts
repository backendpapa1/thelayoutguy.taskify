import { Controller, Get, Post, Body, Patch, Param, Delete,UseGuards, Request, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { ListItemService } from './list-item.service';
import { CreateListItemDto } from './dto/create-list-item.dto';
import { UpdateListItemDto } from './dto/update-list-item.dto';
import { ListItemCommentService } from './list-item-comment.service';
import { ListItemChecklistService } from './list-item-checklist.service';
import { ListItemAttachmentService } from './list-item-attachment.service';
import { TimeLogService } from './time-log.service';
import { ListItemActivityService } from './list-item-activity.service';
import { AuthGuard } from '../_services/guards/auth.guard';
import { MoveItemDto } from './dto/move-item.dto';
import { ReorderItemsDto } from './dto/reorder-items.dto';
import { AssignUserDto } from './dto/assign-user.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { CreateChecklistItemDto } from './dto/create-checklist-item.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { LogTimeDto } from './dto/log-time.dto';
import { StartTimerDto } from './dto/start-timer.dto';
import { PomodoroSettingsDto } from './dto/pomodoro-settings.dto';

@Controller('list-item')
export class ListItemController {
  constructor(
    private readonly itemService: ListItemService,
    private readonly commentService: ListItemCommentService,
    private readonly checklistService: ListItemChecklistService,
    private readonly attachmentService: ListItemAttachmentService,
    private readonly timeLogService: TimeLogService,
    private readonly activityService: ListItemActivityService,
  ) {}

  
  // UseGuards(AuthGuard)
  @Post('')
  createItem(@Request() req, @Body() createItemDto: CreateListItemDto) {
    return this.itemService.createItem(req.user.id, createItemDto);
  }

  // UseGuards(AuthGuard)
  @Get('list/:listId')
  getListItems(@Request() req, @Param('listId') listId: string) {
    return this.itemService.getListItems(req.user.id, listId);
  }

  @Get(':id')
  getItemById(@Request() req, @Param('id') id: string) {
    return this.itemService.getItemById(req.user.id, id);
  }

  @Patch(':id')
  updateItem(
    @Request() req,
    @Param('id') id: string,
    @Body() updateItemDto: UpdateListItemDto,
  ) {
    return this.itemService.updateItem(req.user.id, id, updateItemDto);
  }

  @Delete(':id')
  deleteItem(@Request() req, @Param('id') id: string) {
    return this.itemService.deleteItem(req.user.id, id);
  }

  @Patch(':id/toggle-archive')
  toggleArchive(@Request() req, @Param('id') id: string) {
    return this.itemService.toggleArchive(req.user.id, id);
  }

  // ============ MOVE & REORDER ============

  @Patch(':id/move')
  moveItem(
    @Request() req,
    @Param('id') id: string,
    @Body() moveItemDto: MoveItemDto,
  ) {
    return this.itemService.moveItem(req.user.id, id, moveItemDto);
  }

  @Patch('list/:listId/reorder')
  reorderItems(
    @Request() req,
    @Param('listId') listId: string,
    @Body() reorderDto: ReorderItemsDto,
  ) {
    return this.itemService.reorderItems(req.user.id, listId, reorderDto);
  }

  // ============ ASSIGNEES ============

  @Post(':id/assign')
  assignUser(
    @Request() req,
    @Param('id') id: string,
    @Body() assignUserDto: AssignUserDto,
  ) {
    return this.itemService.assignUser(req.user.id, id, assignUserDto);
  }

  @Delete(':id/unassign/:userId')
  unassignUser(
    @Request() req,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.itemService.unassignUser(req.user.id, id, userId);
  }

  // ============ COMMENTS ============

  @Post(':id/comments')
  addComment(
    @Request() req,
    @Param('id') id: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentService.addComment(req.user.id, id, createCommentDto);
  }

  @Get(':id/comments')
  getComments(@Request() req, @Param('id') id: string) {
    return this.commentService.getItemComments(req.user.id, id);
  }

  @Patch('comments/:commentId')
  updateComment(
    @Request() req,
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentService.updateComment(req.user.id, commentId, updateCommentDto);
  }

  @Delete('comments/:commentId')
  deleteComment(@Request() req, @Param('commentId') commentId: string) {
    return this.commentService.deleteComment(req.user.id, commentId);
  }

  // ============ CHECKLISTS ============

  @Post(':id/checklists')
  createChecklist(
    @Request() req,
    @Param('id') id: string,
    @Body() createChecklistDto: CreateChecklistDto,
  ) {
    return this.checklistService.createChecklist(req.user.id, id, createChecklistDto);
  }

  @Get(':id/checklists')
  getChecklists(@Request() req, @Param('id') id: string) {
    return this.checklistService.getItemChecklists(req.user.id, id);
  }

  @Delete('checklists/:checklistId')
  deleteChecklist(@Request() req, @Param('checklistId') checklistId: string) {
    return this.checklistService.deleteChecklist(req.user.id, checklistId);
  }

  @Post('checklists/:checklistId/items')
  addChecklistItem(
    @Request() req,
    @Param('checklistId') checklistId: string,
    @Body() createItemDto: CreateChecklistItemDto,
  ) {
    return this.checklistService.addChecklistItem(req.user.id, checklistId, createItemDto);
  }

  @Patch('checklist-items/:itemId/toggle')
  toggleChecklistItem(@Request() req, @Param('itemId') itemId: string) {
    return this.checklistService.toggleChecklistItem(req.user.id, itemId);
  }

  @Patch('checklist-items/:itemId')
  updateChecklistItem(
    @Request() req,
    @Param('itemId') itemId: string,
    @Body('content') content: string,
  ) {
    return this.checklistService.updateChecklistItem(req.user.id, itemId, content);
  }

  @Delete('checklist-items/:itemId')
  deleteChecklistItem(@Request() req, @Param('itemId') itemId: string) {
    return this.checklistService.deleteChecklistItem(req.user.id, itemId);
  }

  // ============ ATTACHMENTS ============

  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file'))
  uploadAttachment(
    @Request() req,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.attachmentService.uploadAttachment(req.user.id, id, file);
  }

  @Get(':id/attachments')
  getAttachments(@Request() req, @Param('id') id: string) {
    return this.attachmentService.getItemAttachments(req.user.id, id);
  }

  @Delete('attachments/:attachmentId')
  deleteAttachment(@Request() req, @Param('attachmentId') attachmentId: string) {
    return this.attachmentService.deleteAttachment(req.user.id, attachmentId);
  }

  @Patch('attachments/:attachmentId/set-cover')
  setAsCover(@Request() req, @Param('attachmentId') attachmentId: string) {
    return this.attachmentService.setAsCover(req.user.id, attachmentId);
  }

  // ============ TIME TRACKING ============

  @Post(':id/time-logs')
  logTime(
    @Request() req,
    @Param('id') id: string,
    @Body() logTimeDto: LogTimeDto,
  ) {
    return this.timeLogService.logTime(req.user.id, id, logTimeDto);
  }

  @Get(':id/time-logs')
  getTimeLogs(@Request() req, @Param('id') id: string) {
    return this.timeLogService.getItemTimeLogs(req.user.id, id);
  }

  @Get('my-time-logs')
  getMyTimeLogs(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.timeLogService.getUserTimeLogs(req.user.id, startDate, endDate);
  }

  @Post(':id/timer/start')
  startTimer(
    @Request() req,
    @Param('id') id: string,
    @Body() startTimerDto: StartTimerDto,
  ) {
    return this.timeLogService.startTimer(req.user.id, id, startTimerDto);
  }

  @Post(':id/timer/stop')
  stopTimer(@Request() req, @Param('id') id: string) {
    return this.timeLogService.stopTimer(req.user.id, id);
  }

  @Get('timer/active')
  getActiveTimer(@Request() req) {
    return this.timeLogService.getActiveTimer(req.user.id);
  }

  @Patch(':id/pomodoro-settings')
  updatePomodoroSettings(
    @Request() req,
    @Param('id') id: string,
    @Body() settingsDto: PomodoroSettingsDto,
  ) {
    return this.timeLogService.updatePomodoroSettings(req.user.id, id, settingsDto);
  }

  @Delete('time-logs/:timeLogId')
  deleteTimeLog(@Request() req, @Param('timeLogId') timeLogId: string) {
    return this.timeLogService.deleteTimeLog(req.user.id, timeLogId);
  }

  // ============ ACTIVITIES ============

  @Get(':id/activities')
  getActivities(@Request() req, @Param('id') id: string) {
    return this.activityService.getItemActivities(req.user.id, id);
  }
}
