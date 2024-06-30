import { Body, Controller, Delete, ForbiddenException, Get, Param, Post, Request, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Projects } from '../projects/projects.entity';
import { RncpDefinitionProjects } from './rncp-definition-projects';
import { RncpDefinition } from './rncp-definition.entity';
import { RncpDefinitionService } from './rncp-definition.service';

@Controller('rncp-definition')
export class RncpDefinitionController {
  constructor(
    private readonly service: RncpDefinitionService,

    @InjectRepository(RncpDefinitionProjects)
    private readonly rncpDefinitionProjectRepository: Repository<RncpDefinitionProjects>,
  ) {}

  @Get()
  async getAll() {
    const result = this.service.getAllRncp();
    return result;
  }

  @Post('/project/:rncpProjectId')
  async addChildrenToProjectDefinition(
    @Request() request: any,
    @Param('rncpProjectId') rncpProjectId: number,
    @Body() data: { [key: string]: number },
  ) {
    //replace with guard ?
    if (request.user.isStaff === false && request.user.login !== 'slopez') {
      throw new ForbiddenException();
    }

    try {
      const entity = await this.rncpDefinitionProjectRepository.findOne({
        where: { id: rncpProjectId },
        relations: { childrenProjects: true },
      });

      entity.childrenProjects.push(new Projects(data.childrenProjectId));

      await this.rncpDefinitionProjectRepository.save(entity);

      await this.service.emptyCache();
    } catch (error) {
      throw new UnprocessableEntityException(error?.message);
    }

    return {};
  }

  @Post('/:rncpDefinitionId/project')
  async patchRncpDefinitionProject(
    @Request() request: any,
    @Param('rncpDefinitionId') rncpDefinitionId: number,
    @Body() data: { [key: string]: number },
  ) {
    //replace with guard ?
    if (request.user.isStaff === false && request.user.login !== 'slopez') {
      throw new ForbiddenException();
    }

    try {
      await this.rncpDefinitionProjectRepository.insert({
        rncp: new RncpDefinition(rncpDefinitionId),
        project: new Projects(data.projectId),
      });

      await this.service.emptyCache();

    } catch (error) {
      throw new UnprocessableEntityException(error?.message);
    }

    return {};
  }

  @Delete('/children-project/:rncpDefinitionId/:childrenProjectId')
  async deleteChildrenProject(
    @Request() request: any,
    @Param('rncpDefinitionId') rncpDefinitionId: number,
    @Param('childrenProjectId') childrenProjectId: number,
  ) {
    //replace with guard ?
    if (request.user.isStaff === false && request.user.login !== 'slopez') {
      throw new ForbiddenException();
    }

    try {
      const entity = await this.rncpDefinitionProjectRepository.findOne({
        where: { id: rncpDefinitionId },
        relations: { childrenProjects: true },
      });

      entity.childrenProjects = entity.childrenProjects.filter((p) => p.id !== +childrenProjectId);

      await this.rncpDefinitionProjectRepository.save(entity);

      await this.service.emptyCache();

    } catch (error) {
      throw new UnprocessableEntityException(error?.message);
    }

    return {};
  }

  @Delete('/project/:rncpDefinitionId')
  async deleteProjectFromRncpDefinitionProject(@Request() request: any, @Param('rncpDefinitionId') rncpDefinitionId: number) {
    //replace with guard ?
    if (request.user.isStaff === false && request.user.login !== 'slopez') {
      throw new ForbiddenException();
    }

    try {
      await this.rncpDefinitionProjectRepository.delete({
        id: rncpDefinitionId,
      });

      await this.service.emptyCache();

    } catch (error) {
      throw new UnprocessableEntityException(error?.message);
    }

    return {};
  }
}
