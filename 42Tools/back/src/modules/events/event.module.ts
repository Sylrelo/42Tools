import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EventUser } from "./event-user.entity";
import { Event } from "./event.entity";
import { EventUserService } from "./event-user.service";
import { LastPageAggregateModule } from "../last-page/last-page.module";
import { ApiQueueModule } from "src/services/api-queue.module";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [
    ApiQueueModule,
    UsersModule,
    LastPageAggregateModule,
    TypeOrmModule.forFeature([Event, EventUser]),
    // TypeOrmModule.forFeature([EventUser])
  ],
  providers: [EventUserService],
  exports: [EventUserService]

})

export class EventModule { }