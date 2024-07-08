import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Campus } from "./entities/campus";
import { CampusService } from "./services/campus.service";
import { ApiQueueModule } from "src/services/api-queue.module";
import { CampusController } from "./controllers/campus.controller";
import { Cursus } from "./entities/cursus";
import { CursusUser } from "./entities/cursus-users";
import { CursusUserService } from "./services/cursus-users.service";
import { CursusController } from "./controllers/cursus.controller";

@Module({

    imports: [
        ApiQueueModule,
        TypeOrmModule.forFeature(
            [
                Campus,
                Cursus,
                CursusUser
            ]
        )
    ],

    providers: [
        CampusService,
        CursusUserService
    ],


    controllers: [
        CampusController,
        CursusController
    ],

    exports: [
        CursusUserService,
        TypeOrmModule.forFeature([CursusUser])
    ]
})

export class BaseModule { }