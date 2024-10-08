import { Logger } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { ProjectUsers } from '../project-users/project-users.entity';
import { Projects } from '../projects/projects.entity';
import { RncpDefinition } from '../rncp-definition/rncp-definition.entity';
import { RncpDefinitionService } from '../rncp-definition/rncp-definition.service';
import { Users } from '../users/users.entity';
import { UserService } from '../users/users.service';
import { CachedRncpProgress } from './rncp-progress.entity';

export class RncpProgressService {
  private logger = new Logger('RncpProgressService');

  constructor(
    @InjectRepository(CachedRncpProgress)
    private readonly repo: Repository<CachedRncpProgress>,
    private readonly rncpDefinitionService: RncpDefinitionService,
  ) { }

  async getProgressByUserId(userId: number) {
    const result = await this.repo.find({
      relations: {
        rncp: true,
        user: true,
      },
      select: {
        user: {
          id: true,
          login: true,
        },
      },
      where: {
        user: {
          id: userId,
        },
      },
    });

    return result ?? [];
  }

  async getAll(options?: { campusId?: number }) {
    let result = await this.repo.query(
      `--sql
      SELECT
          rncp.option AS rncp_option,
          rncp.level AS rncp_level,
          rncp.rncp_key AS rncp_rncp_key,

          users.login AS user_login,
          users.id AS user_id,
          users.full_name as user_full_name,
          users.profile_picture as user_profile_picture,

          users.apprenticeship_rncp as user_rncp,
          users.apprenticeship_rythm as user_rythm,
          TO_CHAR(users.apprenticeship_start_date, 'YYYY-MM-DD') as user_apprenticeship_start_date,
          TO_CHAR(users.apprenticeship_end_date, 'YYYY-MM-DD') as user_apprenticeship_end_date,

          (ARRAY_AGG(users.last_updated_at))[1] AS user_last_updated_at,
          (ARRAY_AGG(users.pool_year))[1] AS user_pool_year,

          AVG(cached_rncp_progress.total_progress) AS cached_rncp_progress_total_progress,

          ARRAY_AGG(cached_rncp_progress.total_progress) AS cached_rncp_blocks_progress,
          (ARRAY_AGG(cached_rncp_progress.level_progress))[1] AS cached_rncp_level_progress,
          (ARRAY_AGG(cached_rncp_progress.event_progress))[1] AS cached_rncp_events_progress

      FROM
          cached_rncp_progress
      JOIN
          users ON cached_rncp_progress.user_id = users.id
      JOIN
          rncp_definition AS rncp ON cached_rncp_progress.rncp_id = rncp.id
      WHERE
        users.campus_id = $1
      GROUP BY
          rncp.option,
          rncp.level,
          rncp.rncp_key,

          users.login,
          users.apprenticeship_rncp,
          users.apprenticeship_rythm,
          users.id,
          users.full_name,
          users.profile_picture,
          users.apprenticeship_start_date,
          users.apprenticeship_end_date
      ORDER BY cached_rncp_progress_total_progress DESC
    `,
      [options?.campusId ?? undefined],
    );

    result = result.map((r) => {
      const rncpProgress = new CachedRncpProgress();

      rncpProgress.id = randomUUID();
      rncpProgress.totalProgress = r.cached_rncp_progress_total_progress;
      rncpProgress.levelProgress = r.cached_rncp_level_progress;
      rncpProgress.eventProgress = r.cached_rncp_events_progress;
      rncpProgress.blocksProgress = r.cached_rncp_blocks_progress as number[];

      rncpProgress.user = new Users(r.user_id);
      rncpProgress.user.fullName = r.user_full_name;
      rncpProgress.user.login = r.user_login;
      rncpProgress.user.profilePicture = r.user_profile_picture;
      rncpProgress.user.lastUpdatedAt = r.user_last_updated_at;
      rncpProgress.user.poolYear = r.user_pool_year;

      rncpProgress.user.apprenticeshipStartDate = r.user_apprenticeship_start_date;
      rncpProgress.user.apprenticeshipEndDate = r.user_apprenticeship_end_date;
      rncpProgress.user.apprenticeshipRncp = r.user_rncp;
      rncpProgress.user.apprenticeshipRythm = r.user_rythm;

      rncpProgress.rncp = new RncpDefinition();

      rncpProgress.rncp.level = r.rncp_level;
      rncpProgress.rncp.option = r.rncp_option;
      rncpProgress.rncp.rncpKey = r.rncp_rncp_key;

      return rncpProgress;
    });

    return result;
  }

  async calculateCachedRncpProgressForUser(student: Users) {
    const rncpDefinition = await this.rncpDefinitionService.getAllRncp();

    try {
      const validatedRncpProject = student.projectUser;
      const events = student.eventUser.filter((f) => !['exam', 'extern', 'association'].includes(f.event.kind));

      const proExp = validatedRncpProject.filter(
        (p) => [118, 212, 1638, 1644, 1650, 1656, 2338, 2339, 2340, 2341, 1055, 1662, 1857, 1865].includes(p.project.id) && p.isValidated,
      );

      this.logger.debug(`Updating RNCP Cached Progress for ${student.id} (${student.login ?? ''})`);

      for (const rncp of rncpDefinition) {
        for (const section of rncp.sections) {
          const total = {
            count: 0,
            xp: 0,
          };

          for (const rncpSectionProject of section.projects.filter((sp) => sp.childrenProjects.length)) {
            const tmp = this.getValidatedProjectInfos(validatedRncpProject, rncpSectionProject.childrenProjects);
            total.xp += tmp.xp;
          }

          const tmp = this.getValidatedProjectInfos(
            validatedRncpProject,
            section.projects.map((p) => p.project),
          );

          total.count += tmp.count;
          total.xp += tmp.xp;

          const key = `${student.id}-${section.id}`;

          const maxTokenProjectCount = section.totalProjectCount * 2;
          const maxTokenProjectExperience = section.totalProjectExperience / 3500;
          const maxTokens = maxTokenProjectCount + maxTokenProjectExperience;

          let totalTokens = 0;

          if (section.totalProjectCount > 0) totalTokens += Math.min(maxTokenProjectCount, total.count * 2);
          if (section.totalProjectExperience > 0) totalTokens += Math.min(maxTokenProjectExperience, total.xp / 3500);

          const totalProjectSectionPercent = (totalTokens / maxTokens) * 100;

          const levelProgress = Math.min(100, +((student.level / section.levelRequired) * 100).toFixed(2));
          const eventProgress = Math.min(100, +((events.length / section.eventRequired) * 100).toFixed(2));

          const apprenticeshipMultiplier = proExp.filter((p) => [2339, 2341].includes(p.project.id)).length;
          const proExpProgress = Math.min(
            100,
            +(((proExp.length + apprenticeshipMultiplier) / section.proExperienceRequired) * 100).toFixed(2),
          );

          const totalProgressWithPriorities =
            levelProgress * 0.05 + eventProgress * 0.05 + proExpProgress * 0.02 + totalProjectSectionPercent * 0.88;

          await this.repo.upsert(
            {
              id: key,

              rncp: new RncpDefinition(section.id),
              user: student,

              levelProgress,
              eventProgress,
              proExpProgress,
              totalProgress: totalProgressWithPriorities,
            },
            {
              conflictPaths: {
                id: true,
              },
            },
          );
        }
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

  private getValidatedProjectInfos(projectUsers: ProjectUsers[], rncpProjects: Projects[]) {
    const infos = {
      count: 0,
      xp: 0,
    };

    for (const rncpProject of rncpProjects) {
      const projectUser = projectUsers.find((pu) => pu.project.id === rncpProject.id);

      if (projectUser == null || projectUser.isValidated === false) {
        continue;
      }

      infos.count += 1;
      infos.xp += projectUser.gainedExperience;
    }

    return infos;
  }
}
