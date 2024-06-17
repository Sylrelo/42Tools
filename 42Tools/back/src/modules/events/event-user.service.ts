import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IEventUser } from 'src/Interfaces/42';
import { ApiQueue } from 'src/services/api-queue';
import { Repository } from 'typeorm';
import { LastPageService, LastPageType } from '../last-page/last-page.service';
import { Users } from '../users/users.entity';
import { UserService } from '../users/users.service';
import { EventUser } from './event-user.entity';
import { Event } from './event.entity';

@Injectable()
export class EventUserService {
  private logger = new Logger('EventUserService');

  constructor(
    @InjectRepository(EventUser)
    private readonly eventUserRepository: Repository<EventUser>,

    private readonly userService: UserService,

    private readonly lastPageService: LastPageService,

    private readonly apiQueue: ApiQueue,
  ) {}

  async getLatestEventUser(): Promise<number> {
    let page = 1;
    let _lastEvent = null;

    try {
      while (true) {
        const eventUsers = await this.apiQueue.add<IEventUser[]>(`/v2/events_users?page[size]=100&page[number]=${page}&sort=-id`);

        let duplicateCount = 0;

        for (const eventUser of eventUsers) {
          _lastEvent = eventUser;

          const exists = await this.eventUserRepository.exists({ where: { id: eventUser.id } });
          if (exists === true) {
            duplicateCount++;
            continue;
          }

          if (eventUser.user_id === 0) {
            this.logger.error('No user ID for EventUser');
            continue;
          }

          if (eventUser.user == null && false === (await this.userService.userExists(eventUser.user_id))) {
            this.logger.error('No user relation for EventUser');
            continue;
          }

          const eventEntity = new Event();
          eventEntity.id = eventUser.event.id;
          eventEntity.kind = eventUser.event.kind;

          const eventUserEntity = new EventUser();

          eventUserEntity.event = eventEntity;
          eventUserEntity.id = eventUser.id;

          const user = new Users(eventUser.user_id);
          if (eventUser.user) {
            user.fromUserApi(eventUser.user);
          }

          eventUserEntity.user = user;

          this.logger.verbose(`New EventUser ${eventUser.id} for ${eventUser?.user?.login ?? eventUser?.user?.id ?? eventUser?.user_id}`);
          await this.eventUserRepository.save(eventUserEntity);
        }

        if (page >= 100 || duplicateCount >= 1) break;
        // if (page >= 55 || duplicateCount === eventUsers.length) break;
        page++;
      }
    } catch (error) {
      this.logger.error(error?.message);
    }

    return page;
  }

  //One-time scrapping.
  async getOldEventsOne(maxPages: number): Promise<number> {
    if (maxPages === 0 || typeof maxPages !== 'number') return 0;

    const lastPage = await this.lastPageService.getOne(LastPageType.EVENT_USERS);

    if (lastPage >= 8321) {
      this.logger.warn('ALL OLD EVENTS HAS BEEN SCRAPPED. REMOVE THIS FUNCTION CALL /!\\');
      return 0;
    }

    let page = lastPage;
    let count = 0;

    this.logger.debug(`Starting aggregation starting at page ${page} for a max of ${maxPages}`);

    let _lastEvent: IEventUser;
    try {
      while (true) {
        const eventUsers = await this.apiQueue.add<IEventUser[]>(`/v2/events_users?page[size]=100&page[number]=${page}&sort=id`);
        count++;

        for (const eventUser of eventUsers) {
          _lastEvent = eventUser;

          if (eventUser.user_id === 0) {
            this.logger.error('No user ID for EventUser');
            continue;
          }

          if (eventUser.user == null && false === (await this.userService.userExists(eventUser.user_id))) {
            this.logger.error('No user relation for EventUser');
            continue;
          }

          const eventEntity = new Event();

          eventEntity.id = eventUser.event.id;
          eventEntity.kind = eventUser.event.kind;

          const eventUserEntity = new EventUser();

          eventUserEntity.event = eventEntity;
          eventUserEntity.id = eventUser.id;

          const user = new Users();
          if (eventUser.user) {
            user.fromUserApi(eventUser.user);
          } else {
            user.id = eventUser.user_id;
          }

          eventUserEntity.user = user;

          await this.eventUserRepository.save(eventUserEntity);
        }

        await this.lastPageService.updateOne(LastPageType.EVENT_USERS, page);

        if (eventUsers.length != 100) {
          break;
        }

        page++;
        if (page >= lastPage + maxPages) {
          break;
        }
      }
    } catch (error) {
      this.logger.error(error);
      console.log(_lastEvent);
    }

    return count;
  }

  async getCount() {
    return this.eventUserRepository.count();
  }

  getQueryEventUserCount(): string {
    return this.eventUserRepository.createQueryBuilder('eu').select('COUNT(eu.id) as totalEvents').where('eu.user = u.id').getQuery();
  }
}
