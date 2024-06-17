import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthGuard } from "./auth.guard";
import { APP_GUARD } from "@nestjs/core";

@Module({
    imports: [
        JwtModule
    ],

    providers: [
        {
            provide: APP_GUARD,
            useClass: AuthGuard
        }
    ]
})

export class AuthModule { }