import { Injectable, OnModuleInit } from '@nestjs/common';
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
    const startPage = await this.lastPageService.getOne(LastPageType.PROJECT_SESSIONS);
    this.syncAllProjects(startPage);
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
    let page = startPage ?? 1;

    while (true) {
      try {
        // const projects = await this.apiQueue.add<IProjectSession[]>(`/v2/projects/?page[size]=55&page[number]=${page}&sort=-created_at`)
        const projects = await this.apiQueue.add<IProjectSession[]>(
          `/v2/project_sessions/?page[size]=55&page[number]=${page}&sort=-created_at`,
        );

        console.log(`Getting page ${page}, ${projects.length} results.`);

        this.repo.manager.transaction(async (manager) => {
          for (const project of projects) {
            const projectSession = ProjectSession.FromApi(project);

            await manager.save(projectSession);
          }
        });

        this.lastPageService.updateOne(LastPageType.PROJECT_SESSIONS, page);
        if (projects.length != 55 || page === endPage) {
          break;
        }

        page += 1;
      } catch (error) {
        console.error(error);
        break;
      }
    }
  }
}
