import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RncpDefinition } from "./rncp-definition.entity";
import { RncpDefinitionService } from "./rncp-definition.service";
import { RncpDefinitionProjects } from "./rncp-definition-projects";
import { RncpDefinitionController } from "./rncp-definition.controller";

@Module({
    imports: [
        TypeOrmModule.forFeature([RncpDefinition, RncpDefinitionProjects]),
    ],
    providers: [RncpDefinitionService],
    controllers: [RncpDefinitionController],
    exports: [RncpDefinitionService]
})

export class RncpDefinitionModule { }