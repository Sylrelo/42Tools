import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiKeysModule } from './modules/api-key/api-key.module';
import { EventModule } from './modules/events/event.module';
import { LastPageAggregateModule } from './modules/last-page/last-page.module';
import { ProjectUsersModule } from './modules/project-users/project-users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { RncpDefinitionModule } from './modules/rncp-definition/rncp-definition.module';
import { RncpProgressModule } from './modules/rncp-progress/rncp-progress.module';
import { UserLocationModule } from './modules/user-locations/user-location.module';
import { UsersModule } from './modules/users/users.module';
import { ApiQueueModule } from './services/api-queue.module';
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from './modules/auth/auth.module';
import { ServeStaticModule } from '@nestjs/serve-static';

import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { join } from 'path';
import { BaseModule } from './modules/base/module';
import { CacheModule } from '@nestjs/cache-manager';


@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ".env",
      isGlobal: true,
    }),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'front', 'dist'),
    }),

    CacheModule.register({
      ttl: 60000,
      max: 150,
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env["DB_HOST"],
      username: process.env["DB_USER"],
      password: process.env["DB_PASSWORD"],
      database: process.env["DB_DATABASE"],
      // cache: {
      //   alwaysEnabled: true,
      //   duration: 15 * 1000,
      //   // duration: 160 * 1000,
      // },
      namingStrategy: new SnakeNamingStrategy(),
      entities: [],
      autoLoadEntities: true,
      synchronize: true,
      logging: ["error", 'warn'],
    }),

    ScheduleModule.forRoot(),

    AuthModule,

    RncpDefinitionModule,

    UserLocationModule,


    LastPageAggregateModule,
    ApiQueueModule,
    RncpProgressModule,
    ApiKeysModule,
    UsersModule,
    ProjectsModule,
    ProjectUsersModule,
    EventModule,
    BaseModule

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
