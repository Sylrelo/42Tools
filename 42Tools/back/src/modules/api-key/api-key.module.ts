
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKeys } from './api-key.entity';
import { ApiKeysService } from './api-key.service';

@Module({
    imports: [TypeOrmModule.forFeature([ApiKeys])],
    providers: [ApiKeysService],
    // controllers: [],
    exports: [TypeOrmModule, ApiKeysService]
})

export class ApiKeysModule { }
