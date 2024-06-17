import { Controller, Get } from "@nestjs/common";
import { CampusService } from "../services/campus.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Campus } from "../entities/campus";
import { Repository } from "typeorm";

@Controller("campus")
export class CampusController {
    constructor(
        private readonly campusService: CampusService,

        @InjectRepository(Campus)
        private readonly campusRepository: Repository<Campus>
    ) { }

    @Get()
    async getCampus() {
        return await this.campusRepository.find({ order: { name: "ASC" } });
    }
}