import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectUsersModule } from '../project-users/project-users.module';
import { RncpDefinitionModule } from '../rncp-definition/rncp-definition.module';
import { RncpProgressController } from './rncp-progress.controller';
import { CachedRncpProgress } from './rncp-progress.entity';
import { RncpProgressService } from './rncp-progress.service';

@Module({
  imports: [RncpDefinitionModule, ProjectUsersModule, TypeOrmModule.forFeature([CachedRncpProgress])],
  providers: [RncpProgressService],
  controllers: [RncpProgressController],
  exports: [RncpProgressService],
})
export class RncpProgressModule {}
