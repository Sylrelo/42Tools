import { Repository } from 'typeorm';
import { UserLocation } from './user-location.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression, Timeout } from '@nestjs/schedule';
import { LastPageService, LastPageType } from '../last-page/last-page.service';
import { ApiQueue } from 'src/services/api-queue';
import { ILocation } from 'src/Interfaces/42';
import { Logger } from '@nestjs/common';
import { Users } from '../users/users.entity';
import dayjs from 'dayjs';

export class UserLocationService {
  private logger = new Logger('UserLocationService');

  isRunning = false;

  constructor(
    @InjectRepository(UserLocation)
    private readonly repository: Repository<UserLocation>,

    @InjectRepository(Users)
    private readonly userRepo: Repository<Users>,

    private readonly lastPageService: LastPageService,
    private readonly apiQueue: ApiQueue,
  ) {}

  async getUniquePresenceThisMonth() {
    const query = await this.repository.query(`--sql
        SELECT
            campus_id as "campusId",
            COUNT(DISTINCT user_id) AS "totalUser" 
        FROM
            users_locations
        WHERE
            (EXTRACT(MONTH FROM begin_at) <= EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(MONTH FROM end_at) >= EXTRACT(MONTH FROM CURRENT_DATE))
            AND EXTRACT(YEAR FROM begin_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        GROUP BY
            campus_id
        ORDER BY "totalUser" DESC
    `);

    return query;
  }

  // @Timeout(2000)
  // // 40737
  // // @Cron(CronExpression.EVERY_SECOND)
  // async _time() {
  //   console.clear();
  //   const START = Date.now();
  //   const q = await this.repository.query(`--sql

  //     SELECT
  //       campus_id,
  //       MAX(0, CAST(EXTRACT(epoch FROM (end_at - begin_at))  as integer)) as total
  //     FROM users_locations
  //     WHERE
  //       EXTRACT(YEAR FROM begin_at) = EXTRACT(YEAR FROM CURRENT_DATE)
  //       AND EXTRACT(MONTH FROM begin_at) = EXTRACT(MONTH FROM CURRENT_DATE)
  //     GROUP BY
  //       campus_id

  //   `);

  //   // let campus = {};

  //   // for (const row of q) {
  //   //   if (false === row.campus_id in campus) campus[row.campus_id] = 0;

  //   //   campus[row.campus_id] += dayjs(row.end_at).diff(row.begin_at, 'hours');
  //   // }

  //   // console.log(campus);
  //   console.log(q, q.length);
  //   console.log(Date.now() - START);
  // }

  async getLatestInactiveLocations(): Promise<number> {
    let page = 1;
    let _lastLocation = null;

    let stopQuerying = false;

    try {
      while (true) {
        this.logger.verbose(`Getting location at page ${page}`);

        let duplicateCount = 0;

        const locations = await this.apiQueue.add<ILocation[]>(
          `/v2/locations?filter[active]=false&filter[inactive]=true&filter[future]=false&page[size]=100&page[number]=${page}&sort=-end_at`,
        );

        for (const location of locations) {
          _lastLocation = location;
          const exists = await this.repository.exists({
            where: { id: location.id },
          });

          if (exists) {
            duplicateCount++;
            continue;
          }

          // Because API may have multiple time the same record :clown_emoji:
          const isLocationAlreadyInDatabase = await this.repository.existsBy({
            host: location.host,
            user: new Users(location.user.id),
            campusId: location.campus_id,
            beginAt: location.begin_at,
            endAt: location.end_at,
          });

          if (isLocationAlreadyInDatabase === true) {
            this.logger.verbose('Avoiding duplicate location record insert');
            continue;
          }

          const userLocation = new UserLocation();

          if (location.user != null) {
            const user = Users.FromUserApi(location.user);
            user.campusId = location.campus_id;
            user.lastSeenAt = location.end_at;
            userLocation.user = user;
          }

          userLocation.id = location.id;
          userLocation.campusId = location.campus_id;
          userLocation.host = location.host;
          userLocation.beginAt = location.begin_at;
          userLocation.endAt = location.end_at;

          try {
            await this.repository.save(userLocation);
            await this.userRepo.update({ id: userLocation.user.id }, { lastSeenAt: location.end_at });
          } catch (error: any) {
            this.logger.error(`Cannot update user lastSeenAt: ${error?.message}`);
          }

          this.logger.verbose(`New location ${location?.user?.login} ${userLocation.host} ${userLocation.id} added.`);
        }

        if (page >= 300 || duplicateCount === locations.length) break;
        page++;
      }
    } catch (error) {
      console.log(_lastLocation);
      this.logger.error(error);
    }

    return page;
  }

  // @Timeout(2000)
  // @Cron(CronExpression.EVERY_HOUR)
  async getOldLocations(maxPage: number) {
    if (this.isRunning === true) {
      return;
    }

    let _lastLocation = null;

    try {
      let lastPage = await this.lastPageService.getOne(LastPageType.LOCATIONS, 1);

      let page = lastPage;

      // this.logger.debug(`Getting locations from page ${page}, ${reversed ? "Reversed" : ""}.`);

      while (true) {
        const locations = await this.apiQueue.add<ILocation[]>(
          `/v2/locations?filter[active]=false&page[size]=55&page[number]=${page}&sort=end_at`,
        );

        console.log(locations[0].id, locations[0].end_at);

        // for (const location of locations) {
        //     _lastLocation = location;

        //     const userLocation = new UserLocation()

        //     if (location.user != null) {
        //         // let user = await this.userRepo.findOne({ where: { id: location.user.id }, cache: false })

        //         // console.log(location.user.id, user)
        //         // if (user == null) {
        //         //     user = new Users()

        //         //     user.id = location.user.id;
        //         //     user.login = location.user.login;
        //         //     user.fullName = location.user.usual_full_name ?? location.user.displayname
        //         //     user.email = location.user.email
        //         //     user.campusId = location.campus_id;

        //         //     user.isAlumni = location.user?.["alumni?"] ?? false
        //         //     user.isStaff = location.user?.["staff?"] ?? false

        //         //     user.profilePicture = location.user?.image?.link ?? null
        //         //     user.poolMonth = location.user.pool_month
        //         //     user.poolYear = location.user.pool_year

        //         //     user.lastSeenAt = location.end_at;

        //         //     await this.userRepo.save(user)
        //         // }

        //         const user = new Users();
        //         user.fromUserApi(location.user);
        //         user.campusId = location.campus_id
        //         user.lastSeenAt = location.end_at;

        //         userLocation.user = user

        //     }

        //     userLocation.id = location.id;
        //     userLocation.campusId = location.campus_id;
        //     userLocation.host = location.host;
        //     userLocation.beginAt = location.begin_at;
        //     userLocation.endAt = location.end_at;

        //     await this.repository.save(userLocation)
        // }

        await this.lastPageService.updateOne(LastPageType.LOCATIONS, page);

        if (locations.length !== 55) break;

        page++;
        if (page >= lastPage + maxPage) break;
      }
    } catch (error) {
      console.log(_lastLocation);
      this.logger.error(error);
    }
  }

  async getCount() {
    return this.repository.count();
  }
}
