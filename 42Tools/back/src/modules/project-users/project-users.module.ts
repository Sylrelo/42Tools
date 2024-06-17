
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectUsers } from './project-users.entity';
import { ProjectUserService } from './project-users.service';
import { ProjectUserController } from './project-users.controller';

@Module({
    imports: [TypeOrmModule.forFeature([ProjectUsers])],
    providers: [ProjectUserService],
    controllers: [ProjectUserController],
    exports: [TypeOrmModule, ProjectUserService]
})

export class ProjectUsersModule { }
