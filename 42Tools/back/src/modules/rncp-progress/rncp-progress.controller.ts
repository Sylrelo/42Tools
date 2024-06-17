import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { RncpProgressService } from './rncp-progress.service';
import { AuthGuard } from '../auth/auth.guard';


@Controller("rncp-progress")
export class RncpProgressController {
  constructor(
    private readonly rncpProgressService: RncpProgressService
    // private readonly apiQueue: ApiQueue
  ) { }


  @Get("mine")
  async getMyProgress(@Request() request: any) {

    return await this.rncpProgressService.getProgressByUserId(request["user"].id);
  }

  @Get(":id")
  async getProgress(@Param("id") id: number) {
    return await this.rncpProgressService.getProgressByUserId(id);
  }

  @Get()
  async getAll(
    @Query("campusId") campusId?: number
  ) {
    return await this.rncpProgressService.getAll(
      {
        campusId: campusId ?? undefined
      }
    );
  }

}
