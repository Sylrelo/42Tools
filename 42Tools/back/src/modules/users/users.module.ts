import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiQueueModule } from 'src/services/api-queue.module';
import { ProjectUsersModule } from '../project-users/project-users.module';
import { RncpDefinitionModule } from '../rncp-definition/rncp-definition.module';
import { UsersController } from './users.controller';
import { Users } from './users.entity';
import { UserService } from './users.service';

import { JwtModule } from '@nestjs/jwt';
import { RncpProgressModule } from '../rncp-progress/rncp-progress.module';
import { BaseModule } from '../base/module';

@Module({
  imports: [
    JwtModule, 
    ApiQueueModule, 
    ProjectUsersModule, 
    RncpProgressModule, 
    RncpDefinitionModule,
    TypeOrmModule.forFeature([Users]),
    BaseModule,
  ],
  providers: [UserService],
  controllers: [UsersController],
  exports: [TypeOrmModule, UserService],
})
export class UsersModule {}
