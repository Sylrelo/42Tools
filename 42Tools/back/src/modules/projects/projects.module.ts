
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Projects } from './projects.entity';
import { ProjectService } from './projects.service';
import { ApiQueueModule } from 'src/services/api-queue.module';
import { LastPageAggregateModule } from '../last-page/last-page.module';
import { ProjectSession } from './project-sessions.entity';
import { ProjectsController } from './projects.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Projects, ProjectSession]),
        ApiQueueModule,
        LastPageAggregateModule
    ],
    providers: [
        ProjectService,
    ],
    controllers: [ProjectsController],
    exports: [TypeOrmModule]
})

export class ProjectsModule { }
