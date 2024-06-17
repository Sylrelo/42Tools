import { Controller, Get, Param, Request } from '@nestjs/common';
import { ProjectUserService } from './project-users.service';
import { Users } from '../users/users.entity';

@Controller('project-users')
export class ProjectUserController {
  constructor(private readonly service: ProjectUserService) {}

  @Get('mine')
  async getMine(@Request() request: any) {
    return await this.service.getStatsAllValidatedProject(new Users(request.user.id));
  }

  @Get('recently-validated-projects')
  async getRecentlyValidatedProjects() {
    return await this.service.getRecentlyValidatedProjects();
  }

  @Get('stats-transcendence-validation')
  async getTranscendenceValidationCount() {
    return this.service.getStatsTranscendanceVaidation();
  }

  @Get(':id')
  async getProjects(@Param('id') id: number) {
    return await this.service.getStatsAllValidatedProject(new Users(id));
  }
}
