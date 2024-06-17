import { Controller, Get, Query, Request } from '@nestjs/common';
import { ProjectService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  async getAllProjects(@Query('campusId') campusId?: number, @Query('cursusId') cursusId?: number) {
    return await this.projectService.getAllProjects({
      campusId,
      cursusId,
    });
  }
}
