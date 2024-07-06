import { ForbiddenException, Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILocation, IUser } from 'src/Interfaces/42';
import { ApiQueue } from 'src/services/api-queue';
import { FindOptionsWhere, In, IsNull, LessThan, LessThanOrEqual, Like, MoreThanOrEqual, Not, Or, Repository } from 'typeorm';
import { ProjectUserService } from '../project-users/project-users.service';
import { RncpDefinitionService } from '../rncp-definition/rncp-definition.service';
import { Users } from './users.entity';

import dayjs from 'dayjs';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RncpProgressService } from '../rncp-progress/rncp-progress.service';
import { Cron, CronExpression, Timeout } from '@nestjs/schedule';
import { IUserToken } from 'src/Interfaces/UserToken';

export const CURSUS_ID = 21; // 42cursus
export const CAMPUS_ID = 9;
export const ACHIEVEMENT_PISCINE_ID = 218;

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(Users)
    private repo: Repository<Users>,
    private readonly apiQueue: ApiQueue,
    private readonly projectUserSerivce: ProjectUserService,
    private readonly rncpService: RncpDefinitionService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly rncpProgressService: RncpProgressService,
  ) {}

  /* -------------------------------------------------------------------------- */
  /*                                    STATS                                   */
  /* -------------------------------------------------------------------------- */

  async getStatsOverLevelTwentyOne() {
    return await this.repo.query(`--sql
      SELECT 
        COUNT(*) AS over, 
        (SELECT COUNT(*) FROM users WHERE level > 0) as users
      FROM users WHERE level >= 21
    `);
  }

  async getAvailablePools() {
    return await this.repo
      .createQueryBuilder('u')
      .select(['pool_year', 'pool_month'])
      .andWhere('pool_month IS NOT NULL')
      .andWhere('pool_year IS NOT NULL')
      .groupBy('pool_year')
      .addGroupBy('pool_month')
      .orderBy('pool_year')
      .getRawMany();
  }

  async getCount() {
    const total = await this.repo.count({});
    const totalPendingActive = await this.repo.count({
      where: {
        lastSeenAt: MoreThanOrEqual(dayjs().subtract(24, 'hour').format()),
        lastUpdatedAt: Or(LessThan(dayjs().subtract(12, 'hour').format()), IsNull()),
        ignoreFutureUpdate: false,
        isStaff: false,
        login: Not(Like('3b3-%')),
      },
    });

    const totalPendingInactive = await this.repo.count({
      where: {
        lastUpdatedAt: IsNull(),
        ignoreFutureUpdate: false,
        login: Not(Like('3b3-%')),
      },
    });

    const totalAnonymized = await this.repo.count({
      where: {
        login: Like('3b3-%'),
      },
    });

    return {
      total,
      totalPendingActive,
      totalPendingInactive,
      totalAnonymized,
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                                    UTILS                                   */
  /* -------------------------------------------------------------------------- */

  async updateInactiveStudent(limit: number): Promise<number> {
    if (limit <= 0 || typeof limit !== 'number') return 0;

    const students = await this.repo.find({
      select: {
        id: true,
        login: true,
      },
      where: {
        lastUpdatedAt: IsNull(),
        ignoreFutureUpdate: false,
        login: Not(Like('3b3-%')),
      },
      order: {
        lastSeenAt: {nulls: "LAST", direction: 'ASC'},
      },
      take: limit,
    });

    this.logger.verbose(`Updating ${students.length} inactive students.`);
    for (const student of students) {
      (async () => {
        try {
          this.logger.log(`Updating inactive ${student.login} #${student.id}.`);
          await this.updateFromApi(student.id);
        } catch (error: any) {
          if (error.message === 'NOT_FOUND') {
            await this.repo.update({ id: student.id }, { ignoreFutureUpdate: true });
            this.logger.error(`${student.login} #${student.id} not found. Ignoring for future update.`);
          }
        }
      })();
    }

    return students.length;
  }

  async updateActiveStudent(limit: number): Promise<number> {
    if (limit === 0 || typeof limit !== 'number') return 0;

    // Math.round(Date.now() / 1000) - SIX_HOURS * 2

    const whereConditions = {
      lastSeenAt: MoreThanOrEqual(dayjs().subtract(24, 'hour').format()),
      lastUpdatedAt: Or(LessThan(dayjs().subtract(12, 'hour').format()), IsNull()),
      ignoreFutureUpdate: false,
      isStaff: false,
      login: Not(Like('3b3-%')),
    };

    const students = await this.repo.find({
      select: {
        id: true,
        login: true,
      },
      where: whereConditions,
      order: {
        lastUpdatedAt: 'ASC',
        lastSeenAt: 'DESC',
      },
      take: limit,
    });

    const count = await this.repo.count({
      where: whereConditions,
    });

    this.logger.debug(`Got ${students.length} / ${count} students to update.`);

    for (const student of students) {
      try {
        this.updateFromApi(student.id);
      } catch (error) {
        this.logger.error(error);
      }
    }

    return students.length;
  }

  async updateFromApi(studentId: number) {
    const studentData = await this.apiQueue.add<IUser>(`/v2/users/${studentId}`);

    await this.projectUserSerivce.batchInsert(new Users(studentId), studentData.projects_users);

    const user = Users.FromUserApi(studentData);
    user.lastUpdatedAt = new Date();

    await this.repo.update({ id: studentId }, user);
    await this.updateCachedRncpProgress(studentId);
  }

  async updateCachedRncpProgress(studentId: number) {
    try {
      const userForRncpUpdate = await this.getUserInfoForRncpUpdate(studentId);
      await this.rncpProgressService.calculateCachedRncpProgressForUser(userForRncpUpdate);
      await this.setCachedProgressUpdatedAt(userForRncpUpdate);
    } catch (error) {
      this.logger.error(`Cannot update RNCP Cached Progress for ${studentId}`);
    }
  }

  @Timeout(1000)
  @Cron(CronExpression.EVERY_10_MINUTES)
  async updateAllOlderCachedRncpProgress() {
    const whereConds: FindOptionsWhere<Users>[] = [
      {
        lastCachedProgressUpdatedAt: IsNull(),
        campusId: In([1, 9, 41]),
      },
      {
        lastCachedProgressUpdatedAt: LessThanOrEqual(dayjs().subtract(12, 'hours').format()),
        lastUpdatedAt: MoreThanOrEqual(dayjs().subtract(24, 'hours').format()),
        campusId: In([1, 9, 41]),
      },
    ];

    const users = await this.repo.find({
      where: whereConds,
      select: {
        id: true,
        lastCachedProgressUpdatedAt: true,
      },
      order: {
        lastCachedProgressUpdatedAt: 'ASC',
        lastUpdatedAt: 'DESC',
      },
      take: 50,
    });

    const count = await this.repo.count({ where: whereConds });

    this.logger.verbose(`updateAllOlderCachedRncpProgress: Updating ${users.length} / ${count} users.`);

    for (const user of users) {
      await this.updateCachedRncpProgress(user.id);
    }
  }

  async getUserInfoForRncpUpdate(userId: number) {
    const user = (
      await this.repo.find({
        relations: {
          projectUser: {
            project: true,
          },
          eventUser: {
            event: true,
          },
        },
        select: {
          id: true,
          level: true,
          login: true,
          projectUser: {
            isValidated: true,
            finalMark: true,
            project: {
              id: true,
              experience: true,
            },
          },
          eventUser: {
            id: true,
            event: {
              id: true,
              kind: true,
            },
          },
        },
        where: { id: userId },
      })
    )?.[0];

    return user;
  }

  // @Cron(CronExpression.EVERY_30_MINUTES)
  private async _cronUpdateActiveLocations() {
    let page = 1;

    this.logger.debug('Getting locations');

    while (true) {
      try {
        // const locations = await this.apiQueue.add<ILocation[]>(`/v2/locations?filter[active]=true&page[size]=100&page[number]=${page}&sort=-begin_at&filter[campus_id]=${CAMPUS_ID}`)
        const locations = await this.apiQueue.add<ILocation[]>(
          `/v2/locations?filter[active]=true&page[size]=100&page[number]=${page}&sort=-begin_at`,
        );

        this.repo.manager.transaction(async (manager) => {
          for (const location of locations) {
            if (location.user['staff?'] === true) {
              continue;
            }

            const user: Partial<Users> = {
              id: location.user.id,
              campusId: location.campus_id,

              email: location.user.email,
              login: location.user.login,
              fullName: location.user.usual_full_name,

              isAlumni: location.user['alumni?'],
              profilePicture: location.user.image.link,

              poolMonth: location.user.pool_month,
              poolYear: location.user.pool_year,

              lastSeenAt: Math.round(Date.now() / 1000),
            };

            await manager.upsert(Users, user, { conflictPaths: { id: true } });
          }
        });

        // break;
        if (locations.length !== 100) {
          break;
        }

        page += 1;
      } catch (error) {
        this.logger.error(error);
        break;
      }
    }
  }

  //

  async getRncpProgress() {
    const projectIds = await this.rncpService.getAllProjectsId();

    return this.projectUserSerivce.getValidatedRncpProject(projectIds);
  }

  async getAllStats(options: any) {
    if (options == null) {
      options = {};
      options.page = 1;
      options.order = 'DESC';
    }

    try {
      const START = Date.now();

      const queryBuilder = this.repo
        .createQueryBuilder('user')
        .leftJoin('user.projectUser', 'pu', "pu.user_id = user.id AND pu.is_validated = 'true' AND pu.final_mark > 0")
        // .leftJoin("user.eventUser", "eu", "eu.user_id = user.id")
        .select([
          'user.id',
          'user.login',
          'user.fullName',
          'user.profilePicture',
          'user.poolYear',
          'user.poolLevel',
          'user.campusId',
          'user.lastUpdatedAt',
          'user.level',
          'user.wallet',
          'user.correctionPoint',
          'COUNT(pu.user_id) as user_validated_projects',
          // "SUM(eu.user_id) as user_events"
        ])
        .groupBy('user.id')
        .addGroupBy('user.login')
        .addGroupBy('user.fullName')
        .addGroupBy('user.profilePicture')
        .addGroupBy('user.poolYear')
        .addGroupBy('user.poolLevel')
        .addGroupBy('user.campusId')
        .addGroupBy('user.poolYear')
        .addGroupBy('user.lastUpdatedAt')
        .addGroupBy('user.level')
        .addGroupBy('user.wallet')
        .addGroupBy('user.correctionPoint')
        .cache(true, 60000);
      let order = options.order ?? 'DESC';

      if (options.sort === 'level') {
        queryBuilder.orderBy('user.level', order);
      } else if (options.sort === 'wallet') {
        queryBuilder.orderBy('user.wallet', order);
      } else if (options.sort === 'poolLevel') {
        queryBuilder.orderBy('user.poolLevel', order, 'NULLS LAST');
      } else if (options.sort === 'correctionPoint') {
        queryBuilder.orderBy('user.correctionPoint', order);
      } else if (options.sort === 'projects') {
        queryBuilder.orderBy(`user_validated_projects`, order);
      } else {
        queryBuilder.orderBy('user.level', order);
      }

      queryBuilder.andWhere("user.login NOT LIKE('3b3-%')");
      queryBuilder.andWhere("user.login NOT IN('chmaubla')");
      queryBuilder.andWhere('user.is_staff = false');

      if (options.campus) {
        queryBuilder.andWhere('user.campusId = :campusId', {
          campusId: options.campus,
        });
      }

      if (options.poolMonth) {
        queryBuilder.andWhere('user.poolMonth = :poolMonth', {
          poolMonth: options.poolMonth,
        });
      }

      if (options.poolYear) {
        queryBuilder.andWhere('user.poolYear = :poolYear', {
          poolYear: options.poolYear,
        });
      }

      let result = await queryBuilder.getRawMany();
      const totalResults = result.length;
      const selfPosition = result.findIndex((r) => r.user_id === options.selfUserId);

      result = result.slice(Math.max(0, +((options.page ?? 1) - 1) * 20), Math.min(totalResults, +(options.page ?? 1) * 20));

      result = result.map((r, index) => ({
        ...r,
        index: index + +((options.page ?? 1) - 1) * 20,
      }));

      return {
        result,
        count: totalResults,
        selfPosition,
        timeTaken: Date.now() - START,
      };
    } catch (error) {
      console.error(error);
    }

    throw new UnprocessableEntityException();
  }

  async setCachedProgressUpdatedAt(user: Users) {
    await this.repo.update({ id: user.id }, { lastCachedProgressUpdatedAt: dayjs().format() });
  }

  async userExists(userId: number) {
    return null != (await this.repo.findOneBy({ id: userId }));
  }

  async webAuthLogin(code: string, clientId: string) {
    try {
      const result = await this.apiQueue.add<any>('/oauth/token', {
        body: {
          code,
        },
        clientId,
      });

      const loginResponse : IUser = result?.data ?? result;

      const user = Users.FromUserApi(loginResponse);
      user.lastUpdatedAt = new Date();
      user.lastCachedProgressUpdatedAt = null;

      await this.repo.upsert(user, {
        conflictPaths: {
          id: true,
        },
      });


      try {
        await this.projectUserSerivce.batchInsert(new Users(loginResponse.id), loginResponse.projects_users);
      } catch (error) {
        this.logger.warn('webAuthLogin: Could not update projectUser.');
        console.error(error);
      }

      this.logger.log(`${loginResponse.login} successfully logged-in.`);

      // if (user.level == null || user.level === -1) {
      //   throw new ForbiddenException("You don't have an active main cursus.");
      // }

      // Should not happens
      if (user.anonymizationDate != null && dayjs().isAfter(user.anonymizationDate)) {
        throw new ForbiddenException("You've been anonymized. You can't access API resources anymore.");
      }

      // Should not happens
//      if (user.blackholeDate != null && dayjs().isAfter(user.blackholeDate)) {
//        throw new ForbiddenException("You've been blackholed. You can't access API resources anymore.");
//      }

      const userData: IUserToken = {
        id: loginResponse.id,
        login: loginResponse.login,
        campusId: user.campusId,
        isPool: true,
        poolYear: user.poolYear,
        poolMonth: user.poolMonth,
        // isPool: user.level === -1 || user.level == null,
        isStaff: loginResponse?.['staff?'] ?? false,
      };

      const jwtPayload = {
        sub: userData.id,
        ...userData,
      };

      return {
        userData,
        accessToken: await this.jwtService.signAsync(jwtPayload, {
          secret: this.configService.get<string>('JWT_SECRET'),
        }),
      };
    } catch (error) {
      this.logger.error(`webAuthLogin: ${error?.message}`);
      throw new ForbiddenException(error?.message);
    }
  }

  @Timeout(2500)
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { name: "AnonymizeJob", disabled: false })
  private async anonymizeUsers() {
    const users = await this.repo.update(
      {
        anonymizationDate: LessThan(dayjs().format()),
        login: Not(Like("3b3-%"))
      },
      {
        login: "3b3-Anonymized",
        fullName: "Redacted",
        email: "Redacted",
        profilePicture: null,
      })

    this.logger.log(`Anonymized ${users.affected} users.`)
  }
}

