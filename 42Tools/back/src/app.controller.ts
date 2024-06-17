import { Controller, ForbiddenException, Get, Query, Response, Request } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiQueue } from './services/api-queue';
import { UserService } from './modules/users/users.service';
import { EventUserService } from './modules/events/event-user.service';
import { UserLocationService } from './modules/user-locations/user-location.service';
import { Public } from './modules/auth/public.guard';

@Controller()
export class AppController {
  private TUNNEL_CACHE: any[] = [];

  constructor(
    private readonly appService: AppService,

    private readonly apiQueue: ApiQueue,
    private readonly userService: UserService,
    private readonly eventUserService: EventUserService,
    private readonly userLocations: UserLocationService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  //TODO: Apprenticeship Module (+Database)
  @Get('apprenticeship')
  async getApprenticeshipRythm(@Request() request: any) {
    if (request.user.campusId === 9) {
      return ['Avril_3J2J', 'Avril_2S1S', 'Janvier_2S1S', 'Janvier_3J2J', 'Octobre_2S1S', 'Octobre_3J2J'];
    }

    return [];
  }

  //TODO: Apprenticeship Module (+Database)
  @Get('calendar')
  async getCalendars() {
    return [
      {
        name: 'Avril_3J2J',
        url: 'https://calendar.google.com/calendar/ical/c_e31e70367aebde51d26fce32ec1e7202f7b902b442a3ef3ddedb3fc1c9c11390%40group.calendar.google.com/public/basic.ics',
      },
      {
        name: 'Avril_2S1S',
        url: 'https://calendar.google.com/calendar/ical/c_8b2eea7e76d4924941cf9a7c80157989165fd47d90938bd0ee90d20b62e6e5df%40group.calendar.google.com/public/basic.ics',
      },
      {
        name: 'Janvier_2S1S',
        url: 'https://calendar.google.com/calendar/ical/c_842f545fed2060e7d2762dd0acffff171f0609d77ccd7186f50f45d7eb5d78a5%40group.calendar.google.com/public/basic.ics',
      },
      {
        name: 'Janvier_3J2J',
        url: 'https://calendar.google.com/calendar/ical/c_07ca703db4ce995ddf459f1ebc5e6209f7e6be2895cb6741acb675b34fa2ec91%40group.calendar.google.com/public/basic.ics',
      },
      {
        name: 'Octobre_2S1S',
        url: 'https://calendar.google.com/calendar/ical/c_c16cdbbd04ccece7ad5aaad8e1234bd18edccb372754cb18329b1262394f185a%40group.calendar.google.com/public/basic.ics',
      },
      {
        name: 'Octobre_3J2J',
        url: 'https://calendar.google.com/calendar/ical/c_e836260cbb6c15df0e50d466a76d81ed4caa27b5c4eb5a384987311be5f6d4bd%40group.calendar.google.com/public/basic.ics',
      },
    ];
  }

  @Get('tunnel')
  async tunnelUrl(@Response() response, @Query('url') url: string) {
    if (false === url.includes('calendar.google.com')) {
      throw new ForbiddenException();
    }

    const cached = this.TUNNEL_CACHE.find((c) => c.url === url);

    if (cached != null) {
      response.set({ 'content-type': cached.contentType });
      response.send(cached.body);
      return cached.body;
    }

    const result = await fetch(url);

    if (result.status >= 400) {
      response.send({});
    }

    const body = await result.text();
    const contentType = result.headers.get('content-type');

    this.TUNNEL_CACHE.push({
      url: url,
      body,
      contentType,
    });

    response.set({ 'content-type': contentType });
    response.send(body);
  }

  @Get('api-client-login')
  @Public()
  async getLoginKey() {
    return this.apiQueue.getClientIdApiLogin();
  }

  @Get('server-infos')
  async getServerInfos() {
    const usersCount = await this.userService.getCount();

    return {
      pendingUpdate: {
        activeStudent: usersCount.totalPendingActive,
        inactiveStudent: usersCount.totalPendingInactive,
      },
      requestLeft: await this.apiQueue.getRequestCountLeft(),
      totalRequestPossible: await this.apiQueue.getTotalRequestPossible(),
      count: {
        users: usersCount.total,
        users_anonymized: usersCount.totalAnonymized,
        users_locations: await this.userLocations.getCount(),
        users_events: await this.eventUserService.getCount(),
      },
    };
  }
}
