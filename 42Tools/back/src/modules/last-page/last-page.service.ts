
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LastPageAggregate } from './last-page.entity';

export enum LastPageType {
    PROJECT_SESSIONS,
    LOCATIONS,
    LOCATIONS_REVERSED,
    EVENT_USERS,
    EVENTS_USERS_REVERSED,
}

@Injectable()
export class LastPageService {
    constructor(
        @InjectRepository(LastPageAggregate)
        private repo: Repository<LastPageAggregate>,
    ) { }

    async getOne(type: LastPageType, defaultValue?: number) {
        const result = await this.repo.findOne({ where: { type }, cache: false });

        if (result) {
            return result.page
        }

        return defaultValue ?? 1
    }

    async updateOne(type: LastPageType, page: number) {

        await this.repo.upsert({ type, page, updatedAt: Math.round(Date.now() / 1000) }, { conflictPaths: { type: true } })
    }

}