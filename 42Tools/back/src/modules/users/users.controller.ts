import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Public } from '../auth/public.guard';
import { Users } from './users.entity';
import { UserService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly userService: UserService,

    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
  ) {}

  @Get('available-pools')
  async getAvailablePools() {
    return this.userService.getAvailablePools();
  }

  @Get('over-level-twenty-one')
  async getOverLevelTwentyOne() {
    return await this.userService.getStatsOverLevelTwentyOne();
  }

  //TODO: Rename endpoint
  @Get()
  async getAllStats(
    @Request() request: any,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
    @Query('page') page?: number,
    @Query('poolMonth') poolMonth?: string,
    @Query('poolYear') poolYear?: string,
    @Query('campus') campus?: number,
  ) {
    return this.userService.getAllStats({
      sort,
      order,
      page,
      poolMonth,
      poolYear,
      campus,
      selfUserId: request.user?.id,
    });
  }

  @Get('/apprentices')
  async getAllApprentices(@Request() request: any) {
    return await this.userRepository.find({
      where: {
        campusId: request.user.campusId,
        apprenticeshipRythm: Not(IsNull()),
      },
      select: {
        login: true,
        fullName: true,
        apprenticeshipRythm: true,
        profilePicture: true,

        apprenticeshipEndDate: true,
        apprenticeshipStartDate: true,
      },
    });
  }

  //TODO: Rename endpoint
  @Get('/minimal')
  async getSimpleStudentList(@Request() request: any) {
    return await this.userRepository.find({
      where: {
        campusId: request.user.campusId,
      },
      select: {
        id: true,
        fullName: true,
        login: true,
        poolYear: true,
        profilePicture: true,
        apprenticeshipEndDate: true,
        apprenticeshipStartDate: true,
        apprenticeshipRythm: true,
      },
    });
  }

  @Patch('/:id')
  async updateSingleStudent(@Request() request: any, @Param('id') id: number, @Body() body: Partial<Users>) {
    //TODO: replace with guard
    if (request.user.isStaff === false && request.user.login !== 'slopez') {
      throw new ForbiddenException();
    }

    const updateResult = await this.userRepository.update(
      {
        id: id,
        campusId: request.user.campusId,
      },
      {
        ...body,
      },
    );

    if (updateResult.affected === 0) {
      throw new UnprocessableEntityException();
    }

    return {};
  }

  @Public()
  @Post('login')
  async webAuth(@Body('code') code: string, @Body('clientId') clientId: string) {
    const result = await this.userService.webAuthLogin(code, clientId);
    return result;
  }

  @Get('/rncp-progress')
  async getRncpProgress() {
    return await this.userService.getRncpProgress();
  }

  @Get('me')
  async getMyProfile(@Request() request: any) {
    return await this.userRepository.findOne({
      where: {
        id: request.user.id,
      },
      select: ['id', 'level'],
    });
  }
}
