import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { rncp, suite } from '../../rncp.definition';
import { Projects } from '../projects/projects.entity';
import { RncpDefinitionProjects } from './rncp-definition-projects';
import { RncpDefinition } from './rncp-definition.entity';
import { Timeout } from '@nestjs/schedule';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

export interface RncpDefinitionInterface {
  level: number;
  option: number;
  sections: Partial<RncpDefinition>[];
}

@Injectable()
export class RncpDefinitionService {
  static CACHE_KEY = 'ALL_RNCP_DEFINITIONS';

  constructor(
    @InjectRepository(RncpDefinition)
    private readonly repo: Repository<RncpDefinition>,

    @InjectRepository(RncpDefinitionProjects)
    private readonly rncpProject: Repository<RncpDefinitionProjects>,

    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async emptyCache() {
    await this.cacheManager.del(RncpDefinitionService.CACHE_KEY);
  }

  async getAllRncp(): Promise<RncpDefinitionInterface[]> {
    const cachedRncp = await this.cacheManager.get<RncpDefinitionInterface[]>(RncpDefinitionService.CACHE_KEY);

    if (cachedRncp != null) {
      return cachedRncp;
    }

    const rncps = await this.repo.find({
      select: {
        id: true,
        level: true,
        option: true,
        section: true,
        levelRequired: true,
        eventRequired: true,
        proExperienceRequired: true,
        totalProjectCount: true,
        totalProjectExperience: true,
        projects: {
          id: true,
          project: {
            id: true,
            name: true,
            experience: true,
          },
          childrenProjects: {
            id: true,
            name: true,
            experience: true,
          },
        },
      },
      relations: {
        projects: {
          project: true,
          childrenProjects: true,
        },
      },
    });

    const result: RncpDefinitionInterface = {} as any;

    for (const rncp of rncps) {
      const key = `${rncp.level}-${rncp.option}`;

      if (key in result === false) {
        result[key] = {
          level: rncp.level,
          option: rncp.option,
          sections: [],
        };
      }

      rncp.projects.sort((a, b) => a.project.name.localeCompare(b.project.name));

      for (const cp of rncp.projects) {
        cp.childrenProjects.sort((a, b) => a.name.localeCompare(b.name));
      }

      result[key].sections.push({
        id: rncp.id,
        section: rncp.section,

        levelRequired: rncp.levelRequired,
        eventRequired: rncp.eventRequired,
        proExperienceRequired: rncp.proExperienceRequired,

        totalProjectCount: rncp.totalProjectCount,
        totalProjectExperience: rncp.totalProjectExperience,

        projects: rncp.projects,
      });
    }

    const finalResult = Object.values(result);

    await this.cacheManager.set(RncpDefinitionService.CACHE_KEY, finalResult, 160000);

    return finalResult;
  }

  async getAllProjectsId(): Promise<number[]> {
    const result = await this.repo.find({
      select: {
        projects: {
          id: true,
          project: {
            id: true,
          },
          childrenProjects: {
            id: true,
          },
        },
        id: true,
      },
      relations: {
        projects: {
          project: true,
          childrenProjects: true,
        },
      },
    });

    const projectIds = new Set<number>();

    for (const rncpDefinition of result) {
      for (const project of rncpDefinition.projects) {
        projectIds.add(project.project.id);

        for (const childrenProject of project.childrenProjects) {
          projectIds.add(childrenProject.id);
        }
      }
    }

    return Array.from(projectIds);
  }

  // @Timeout(500)
  async _init() {
    console.log('Init RNCP Definition');

    await this.repo.delete({});

    for (const rncpLevel in rncp) {
      // console.log(rncpLevel)

      for (const option of rncp[rncpLevel].options) {
        // console.log(option)

        for (const section of option.section) {
          // console.log(section)

          const rncpDefinition = new RncpDefinition();

          if (rncpLevel === 'rncp-7') {
            rncpDefinition.level = 7;
          }
          rncpDefinition.levelRequired = rncp[rncpLevel].level;
          rncpDefinition.eventRequired = rncp[rncpLevel].eventCount;
          rncpDefinition.proExperienceRequired = rncp[rncpLevel].experiences;

          rncpDefinition.option = option.option;
          rncpDefinition.section = section.name;
          rncpDefinition.totalProjectCount = section.projectCount;
          rncpDefinition.totalProjectExperience = section.experience;

          const resultRncpDefinition = await this.repo.save(rncpDefinition);

          for (const project of section.projects) {
            try {
              const projectId = project?.mainProjectId ?? project;

              const iProject = new RncpDefinitionProjects();

              iProject.rncp = resultRncpDefinition;
              iProject.project = new Projects().id = projectId;

              iProject.childrenProjects = (project.projects ?? []).map((p) => new Projects(p));

              await this.rncpProject.save(iProject);
            } catch (error) {
              console.error(error?.message);
            }
          }
        }

        const rncpDefinition = new RncpDefinition();

        if (rncpLevel === 'rncp-7') {
          rncpDefinition.level = 7;
        }

        rncpDefinition.levelRequired = rncp[rncpLevel].level;
        rncpDefinition.eventRequired = rncp[rncpLevel].eventCount;
        rncpDefinition.proExperienceRequired = rncp[rncpLevel].experiences;

        rncpDefinition.option = option.option;
        rncpDefinition.section = 'Suite';
        rncpDefinition.totalProjectCount = 1;
        rncpDefinition.totalProjectExperience = 0;

        const rncpDefinitionSuite = await this.repo.save(rncpDefinition);

        for (const suiteProject of suite.projects) {
          const iProject = new RncpDefinitionProjects();

          iProject.rncp = rncpDefinitionSuite;
          iProject.project = new Projects(suiteProject);
          await this.rncpProject.save(iProject);
        }
      }
    }
  }
}
