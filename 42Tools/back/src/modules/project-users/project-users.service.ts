import { Between, In, MoreThan, Repository } from 'typeorm';
import { ProjectUsers } from './project-users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { IProjectUser } from 'src/Interfaces/42';
import { Users } from '../users/users.entity';
import { Projects } from '../projects/projects.entity';
import dayjs from 'dayjs';
import { Timeout } from '@nestjs/schedule';

export class ProjectUserService {
  constructor(
    @InjectRepository(ProjectUsers)
    private readonly repo: Repository<ProjectUsers>,
  ) {}

  async batchInsert(student: Users, projectUsers: IProjectUser[]) {
    if (projectUsers.length === 0) {
      return;
    }

    await this.repo.manager.transaction(async (manager) => {
      for (const projectUser of projectUsers) {
        const projectUserEntity = ProjectUsers.FromApi(projectUser);

        projectUserEntity.user = student;
        await manager.save(projectUserEntity);
      }
    });
  }

  async getStatsTranscendanceVaidation() {
    const result = await this.repo.query(`--sql
      SELECT 
        u.campus_id, COUNT(pu.id) as "validatedCount", 
        (
          SELECT COUNT(id) as u 
          FROM users 
          WHERE 
          pool_year IS NOT NULL
          AND CAST(pool_year AS integer) >= 2019 
          AND campus_id = u.campus_id
          AND is_staff = false
          AND level > 0
        ) as "totalUser"

        FROM projects_users AS pu
        JOIN users AS u ON pu.user_id = u.id

        WHERE project_id = 1337 
        AND is_validated = true 
        AND final_mark > 50
        AND u.is_staff = false
        AND u.pool_year IS NOT NULL
        AND CAST(u.pool_year AS integer) >= 2019

        GROUP BY u.campus_id
        ORDER BY "validatedCount" DESC
    `);

    return result;
  }

  async getRecentlyValidatedProjects(campusId?: number) {
    const result = await this.repo
      .createQueryBuilder('up')
      .leftJoin('up.user', 'u')
      .where('up.finalMark > 50')
      .andWhere('up.isValidated = true')
      .andWhere('up.createdAt >= :datestart', { datestart: dayjs().startOf('year').format() })
      .andWhere('up.createdAt <= :dateend', { dateend: dayjs().endOf('week').format() })
      .select(['COUNT(up.id) as count', 'AVG(up.finalMark) as average_final_mark', 'u.campusId'])
      .groupBy('u.campusId')
      .getRawMany();

    return result ?? {};
  }

  async getStatsAllValidatedProject(user?: Users) {
    const result = await this.repo.find({
      select: {
        user: {
          id: true,
        },
        finalMark: true,
        project: {
          id: true,
          experience: true,
        },
      },
      relations: {
        project: true,
      },
      where: {
        isValidated: true,
        user: {
          id: user?.id ?? undefined,
        },
      },
    });

    return result ?? [];
  }

  async getValidatedRncpProject(projectIds: number[], userId?: number) {
    return await this.repo.find({
      select: {
        user: {
          id: true,
        },
        finalMark: true,
        project: {
          id: true,
          experience: true,
          name: true,
        },
      },

      relations: {
        project: true,
        user: true,
      },

      where: {
        project: In(projectIds),
        isValidated: true,
        user: userId ? new Users(userId) : undefined,
      },
    });
  }
}
