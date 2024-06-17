
import { Module } from '@nestjs/common';
import { ApiQueue } from './api-queue';
import { ApiKeysModule } from 'src/modules/api-key/api-key.module';

@Module({
    imports: [
        ApiKeysModule
    ],
    providers: [ApiQueue],
    exports: [ApiQueue]
})

export class ApiQueueModule { }
