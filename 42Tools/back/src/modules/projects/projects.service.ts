import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IProjectSession } from 'src/Interfaces/42';
import { ApiQueue } from 'src/services/api-queue';
import { Repository } from 'typeorm';
import { LastPageService, LastPageType } from '../last-page/last-page.service';
import { ProjectSession } from './project-sessions.entity';
import { Projects } from './projects.entity';
import { Cron, CronExpression, Timeout } from '@nestjs/schedule';

@Injectable()
export class ProjectService implements OnModuleInit {

  private readonly _logger = new Logger(ProjectService.name);

  constructor(
    @InjectRepository(Projects)
    private repo: Repository<Projects>,

    @InjectRepository(ProjectSession)
    private readonly projectSessionRepository: Repository<ProjectSession>,

    private readonly lastPageService: LastPageService,
    private readonly apiQueue: ApiQueue,
  ) {}

  async onModuleInit() {
    this._cronSync();
  }

  @Cron(CronExpression.EVERY_WEEK, { disabled: false, name: 'syncProjectSession' })
  private async _cronSync() {
    this.syncAllProjects(1);
  }

  async getAllProjects(options?: { campusId?: number; cursusId?: number }) {
    // options = {
    //     campusId : 9,
    //     cursusId: 21
    // }

    const projects = (
      await this.repo.find({
        relations: {
          projectSession: true,
        },
        where: {
          projectSession: {
            campusId: options?.campusId ?? undefined,
            cursusId: options?.cursusId ?? undefined,
          },
        },
        order: {
          name: 'ASC',
        },
      })
    ).map((project) => ({
      ...project,
      experience: project.projectSession?.[0]?.experience ?? project.experience ?? 0,
      estimatedTime: project.projectSession?.[0]?.estimatedTime ?? project.estimatedTime ?? 0,
      // description: project.projectSession[0].description,
    }));

    return projects;
  }

  async syncAllProjects(startPage?: number, endPage?: number) {
    const TOTAL_PER_PAGE = 50;

    let page = startPage ?? 1;
    let duplicateCount = 0;

    while (true) {
      try {
        duplicateCount = 0;
        const projectSessions = await this.apiQueue.add<IProjectSession[]>(
          `/v2/project_sessions/?page[size]=${TOTAL_PER_PAGE}&page[number]=${page}&sort=-updated_at`,
        );

        for (const projectSession of projectSessions) {
          try {
            const result = await this.projectSessionRepository.exists({
              where: {
                id: projectSession.id,
                updatedAt: projectSession.updated_at,
                cursusId: projectSession.cursus_id,
                campusId: projectSession.campus_id,
              }
            })
  
            if (result) {
              duplicateCount++;
            } else {
              const projectSessionEntity = ProjectSession.FromApi(projectSession);
              await this.projectSessionRepository.save(projectSessionEntity);
            }
          } catch(error) {
            this._logger.error(error)
          }
        }

        this._logger.log(`Updated ${projectSessions.length - duplicateCount} projects sessions (page ${page})`);
        if (projectSessions.length != TOTAL_PER_PAGE || page === endPage || duplicateCount === projectSessions.length) {
          break;
        }

        page += 1;
      } catch (error) {
        this._logger.error(error)
        break;
      }
    }
  }
}

