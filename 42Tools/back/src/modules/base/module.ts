import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Campus } from "./entities/campus";
import { CampusService } from "./services/campus.service";
import { ApiQueueModule } from "src/services/api-queue.module";
import { CampusController } from "./controllers/campus.controller";

@Module({

    imports: [
        ApiQueueModule,
        TypeOrmModule.forFeature(
            [
                Campus
            ]
        )
    ],

    providers: [
        CampusService
    ],


    controllers: [
        CampusController,
    ]

})

export class BaseModule { }