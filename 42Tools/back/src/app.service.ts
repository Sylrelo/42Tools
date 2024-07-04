import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry, Timeout } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import { DataSource } from 'typeorm';
import { EventUserService } from './modules/events/event-user.service';
import { RncpProgressService } from './modules/rncp-progress/rncp-progress.service';
import { UserLocationService } from './modules/user-locations/user-location.service';
import { UserService } from './modules/users/users.service';
import { ApiQueue } from './services/api-queue';
import { IProjectSession } from './Interfaces/42';

@Injectable()
export class AppService {
  private logger = new Logger('App');

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly apiQueue: ApiQueue,

    private readonly userLocationService: UserLocationService,
    private readonly eventUsersService: EventUserService,
    private readonly userService: UserService,

    private readonly rncpProgressService: RncpProgressService,
  ) { }


  @Cron(CronExpression.EVERY_MINUTE, { disabled: false, name: 'syncJob' })
  async syncJob() {
    let maxRequests = 20;

    const requestLeftThisHour = await this.apiQueue.getRequestCountLeft();

    const currentMinute = dayjs().minute() + 1;
    const currentHour = dayjs().hour() + 1;
    const currentDay = dayjs().day();

    const estimatedRequestLeft = (await this.apiQueue.getTotalRequestPossible()) - (currentMinute * maxRequests - maxRequests);
    const requestRatio = Math.min(1.0, requestLeftThisHour / estimatedRequestLeft);

    this.logger.log(
      `Requests left ${requestLeftThisHour} of ${estimatedRequestLeft} that should be left (${requestRatio}). Adapting maxRequest for this job from ${maxRequests} to ${Math.floor(maxRequests * requestRatio)}`,
    );

    if (process.env?.NODE_ENV === 'dev') {
      this.logger.debug('Ignoring CronTask on DEV ENV');
      return;
    }

    maxRequests = Math.max(0, Math.floor(maxRequests * requestRatio));

    try {
      const TIME_START = Date.now();

      let requestsMade = 0;
      let remaining = maxRequests;

      // EVENTS UPDATE
      // Every 30 minutes after 19h and the weekend, otherwize every two minutes.
      if (currentHour >= 19 || currentDay === 0 || currentDay === 6 ? currentMinute % 30 === 0 : currentMinute % 2 === 0) {
        requestsMade = await this.eventUsersService.getLatestEventUser();
        remaining = Math.max(0, remaining - requestsMade);
      }

      // LOCATIONS UPDATE
      // Every two minutes.
      if (currentMinute % 2 === 0) {
        requestsMade = await this.userLocationService.getLatestInactiveLocations();
        remaining = Math.max(0, remaining - requestsMade);
      }

      // ACTIVE STUDENT UPDATE
      requestsMade = await this.userService.updateActiveStudent(remaining);
      remaining = Math.max(0, remaining - requestsMade);

      // // OLD USER EVENTS (REMOVE WHEN MAX PAGE HAS BEEN SCRAPPED)
      requestsMade = await this.eventUsersService.getOldEventsOne(Math.min(10, remaining));
      remaining = Math.max(0, remaining - requestsMade);

      // INACTIVE STUDENT UPDATE
      requestsMade = await this.userService.updateInactiveStudent(remaining);
      remaining = Math.max(0, remaining - requestsMade);

      // this.rncpProgressService.calculateCachedRncpProgress();

      console.log('Took', Date.now() - TIME_START, 'ms');
    } catch (error) {
      console.error(error);
    }
  }
}
