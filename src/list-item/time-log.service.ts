import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { TimeLog, TimeLogType } from './entities/time-log.entity';
import { ListItem } from './entities/list-item.entity';
import { WorkspaceMember, WorkspaceMemberRole, WorkspaceMemberStatus } from '../workspace/entities/workspace-member.entity';
import { ListItemActivity, ActivityType } from './entities/list-item-activity.entity';
import { LogTimeDto } from './dto/log-time.dto';
import { StartTimerDto } from './dto/start-timer.dto';
import { PomodoroSettingsDto } from './dto/pomodoro-settings.dto';

@Injectable()
export class TimeLogService {
  constructor(
    @InjectRepository(TimeLog)
    private timeLogRepository: Repository<TimeLog>,
    @InjectRepository(ListItem)
    private listItemRepository: Repository<ListItem>,
    @InjectRepository(WorkspaceMember)
    private workspaceMemberRepository: Repository<WorkspaceMember>,
    @InjectRepository(ListItemActivity)
    private activityRepository: Repository<ListItemActivity>,
  ) {}

  private async verifyItemAccess(
    userId: string,
    itemId: string,
  ): Promise<{ item: ListItem; member: WorkspaceMember }> {
    const item = await this.listItemRepository.findOne({
      where: { id: itemId },
      relations: ['list', 'list.workspace'],
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    const member = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId: item.list.workspace.id,
        userId,
        status: WorkspaceMemberStatus.ACTIVE,
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    return { item, member };
  }

  async logTime(userId: string, itemId: string, logTimeDto: LogTimeDto) {
    await this.verifyItemAccess(userId, itemId);

    const startTime = logTimeDto.startTime
      ? new Date(logTimeDto.startTime)
      : new Date();
    const endTime = new Date(startTime.getTime() + logTimeDto.duration * 60000);

    const timeLog = this.timeLogRepository.create({
      listItemId: itemId,
      userId,
      duration: logTimeDto.duration,
      type: TimeLogType.MANUAL,
      startTime,
      endTime,
      note: logTimeDto.note,
    });

    const savedLog = await this.timeLogRepository.save(timeLog);

    await this.listItemRepository.increment(
      { id: itemId },
      'trackedTime',
      logTimeDto.duration,
    );

    const activity = this.activityRepository.create({
      listItemId: itemId,
      userId,
      type: ActivityType.TIME_LOGGED,
      description: `logged ${logTimeDto.duration} minutes`,
      metadata: {
        duration: logTimeDto.duration,
        note: logTimeDto.note,
      },
    });
    await this.activityRepository.save(activity);

    return {
      message: 'Time logged successfully',
      timeLog: savedLog,
    };
  }

  async startTimer(userId: string, itemId: string, startTimerDto: StartTimerDto) {
    await this.verifyItemAccess(userId, itemId);

    const activeTimer = await this.timeLogRepository.findOne({
      where: {
        userId,
        endTime: undefined,
      },
    });

    if (activeTimer) {
      throw new BadRequestException('You already have an active timer running');
    }

    const timeLog = this.timeLogRepository.create({
      listItemId: itemId,
      userId,
      duration: 0,
      type: startTimerDto.isPomodoro ? TimeLogType.POMODORO : TimeLogType.TIMER,
      startTime: new Date(),
      isPomodoroSession: startTimerDto.isPomodoro || false,
    });

    const savedLog = await this.timeLogRepository.save(timeLog);

    return {
      message: 'Timer started successfully',
      timeLog: savedLog,
    };
  }

  async stopTimer(userId: string, itemId: string) {
    const activeTimer = await this.timeLogRepository.findOne({
      where: {
        listItemId: itemId,
        userId,
        endTime: undefined,
      },
    });

    if (!activeTimer) {
      throw new NotFoundException('No active timer found for this item');
    }

    const endTime = new Date();
    const durationMs = endTime.getTime() - activeTimer.startTime.getTime();
    const durationMinutes = Math.round(durationMs / 60000);

    activeTimer.endTime = endTime;
    activeTimer.duration = durationMinutes;

    await this.timeLogRepository.save(activeTimer);

    await this.listItemRepository.increment(
      { id: itemId },
      'trackedTime',
      durationMinutes,
    );


    if (activeTimer.isPomodoroSession) {
      await this.listItemRepository.increment(
        { id: itemId },
        'pomodoroCompletedSessions',
        1,
      );

      const activity = this.activityRepository.create({
        listItemId: itemId,
        userId,
        type: ActivityType.POMODORO_COMPLETED,
        description: `completed a pomodoro session (${durationMinutes} minutes)`,
        metadata: {
          duration: durationMinutes,
        },
      });
      await this.activityRepository.save(activity);
    } else {
      const activity = this.activityRepository.create({
        listItemId: itemId,
        userId,
        type: ActivityType.TIME_LOGGED,
        description: `tracked ${durationMinutes} minutes`,
        metadata: {
          duration: durationMinutes,
        },
      });
      await this.activityRepository.save(activity);
    }

    return {
      message: 'Timer stopped successfully',
      timeLog: activeTimer,
    };
  }

  async getActiveTimer(userId: string) {
    const activeTimer = await this.timeLogRepository.findOne({
      where: {
        userId,
        endTime: undefined,
      },
      relations: ['listItem'],
      select: {
        id: true,
        startTime: true,
        isPomodoroSession: true,
        listItem: {
          id: true,
          title: true,
        },
      },
    });

    return activeTimer;
  }

  async getItemTimeLogs(userId: string, itemId: string) {
    await this.verifyItemAccess(userId, itemId);

    const timeLogs = await this.timeLogRepository.find({
      where: { listItemId: itemId },
      relations: ['user'],
      select: {
        id: true,
        duration: true,
        type: true,
        startTime: true,
        endTime: true,
        note: true,
        isPomodoroSession: true,
        createdAt: true,
        user: {
          id: true,
          name: true,
        },
      },
      order: {
        startTime: 'DESC',
      },
    });

    return timeLogs;
  }

  async getUserTimeLogs(userId: string, startDate?: string, endDate?: string) {
    const where: any = { userId };

    if (startDate && endDate) {
      where.startTime = Between(new Date(startDate), new Date(endDate));
    }

    const timeLogs = await this.timeLogRepository.find({
      where,
      relations: ['listItem'],
      select: {
        id: true,
        duration: true,
        type: true,
        startTime: true,
        endTime: true,
        note: true,
        isPomodoroSession: true,
        listItem: {
          id: true,
          title: true,
        },
      },
      order: {
        startTime: 'DESC',
      },
    });

    const totalMinutes = timeLogs.reduce((sum, log) => sum + log.duration, 0);

    return {
      timeLogs,
      summary: {
        totalMinutes,
        totalHours: (totalMinutes / 60).toFixed(2),
        totalSessions: timeLogs.length,
        pomodoroSessions: timeLogs.filter((log) => log.isPomodoroSession).length,
      },
    };
  }

  async updatePomodoroSettings(
    userId: string,
    itemId: string,
    settingsDto: PomodoroSettingsDto,
  ) {
    await this.verifyItemAccess(userId, itemId);

    await this.listItemRepository.update(
      { id: itemId },
      {
        pomodoroWorkDuration: settingsDto.workDuration,
        pomodoroBreakDuration: settingsDto.breakDuration,
      },
    );

    return {
      message: 'Pomodoro settings updated successfully',
      settings: settingsDto,
    };
  }

  async deleteTimeLog(userId: string, timeLogId: string) {
    const timeLog = await this.timeLogRepository.findOne({
      where: { id: timeLogId },
    });

    if (!timeLog) {
      throw new NotFoundException('Time log not found');
    }

    if (timeLog.userId !== userId) {
      throw new ForbiddenException('You can only delete your own time logs');
    }

    await this.listItemRepository.decrement(
      { id: timeLog.listItemId },
      'trackedTime',
      timeLog.duration,
    );

    if (timeLog.isPomodoroSession) {
      await this.listItemRepository.decrement(
        { id: timeLog.listItemId },
        'pomodoroCompletedSessions',
        1,
      );
    }

    await this.timeLogRepository.remove(timeLog);

    return {
      message: 'Time log deleted successfully',
    };
  }
}