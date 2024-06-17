import { Injectable, Logger } from "@nestjs/common";
import { Repository } from "typeorm";
import { Campus } from "../entities/campus";
import { InjectRepository } from "@nestjs/typeorm";
import { Cron, CronExpression, Timeout } from "@nestjs/schedule";
import { ApiQueue } from "src/services/api-queue";
import { ICampus } from "src/Interfaces/42";

@Injectable()
export class CampusService {
    private readonly logger = new Logger("CampusService");

    constructor(
        @InjectRepository(Campus)
        private readonly campusRepository: Repository<Campus>,


        private readonly apiQueue: ApiQueue,
    ) { }

    @Timeout(2500)
    @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
    async syncCampus() {
        let page = 1;
        this.logger.log("Updating campus.")

        while (true) {
            try {
                const campuses = await this.apiQueue.add<ICampus[]>(`/v2/campus?page[size]=100&page[number]=${page}`)

                for (const campus of campuses) {
                    const campusEntity = Campus.FromApi(campus)
                    await this.campusRepository.save(campusEntity);
                }

                if (campuses.length < 100)
                    break

            } catch (error) {
                console.error(error)
            }
        }
    }
}
