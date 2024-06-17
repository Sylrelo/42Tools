
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LastPageAggregate } from './last-page.entity';
import { LastPageService } from './last-page.service';

@Module({
    imports: [TypeOrmModule.forFeature([LastPageAggregate])],
    providers: [LastPageService],
    exports: [TypeOrmModule, LastPageService]
})

export class LastPageAggregateModule { }
