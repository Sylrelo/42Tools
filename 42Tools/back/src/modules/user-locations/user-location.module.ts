import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserLocation } from "./user-location.entity";
import { LastPageAggregateModule } from "../last-page/last-page.module";
import { UserLocationService } from "./user-location.service";
import { ApiQueueModule } from "src/services/api-queue.module";
import { UsersModule } from "../users/users.module";
import { UserLocationController } from "./user-location.controller";

@Module({
    imports: [
        ApiQueueModule,
        LastPageAggregateModule,
        UsersModule,
        TypeOrmModule.forFeature([UserLocation]),
    ],
    controllers: [UserLocationController],
    providers: [UserLocationService],
    exports: [UserLocationService]
})

export class UserLocationModule { }