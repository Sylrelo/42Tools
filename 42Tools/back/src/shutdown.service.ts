import { OnModuleDestroy } from "@nestjs/common";

export class ShutdownService implements OnModuleDestroy {

    onModuleDestroy() {
        console.log("Destroy.");
    }
}