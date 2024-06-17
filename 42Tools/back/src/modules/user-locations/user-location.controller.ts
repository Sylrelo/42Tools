import { Controller, Get } from "@nestjs/common";
import { UserLocationService } from "./user-location.service";


@Controller("users-locations")
export class UserLocationController {

    constructor(
        private readonly userLocationService: UserLocationService,
    ) {

    }


    @Get("/unique-user-month")
    async getUniqueMaxPerCampus() {
        return await this.userLocationService.getUniquePresenceThisMonth();
    }
}