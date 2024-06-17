import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { IS_PUBLIC_KEY } from "./public.guard";

@Injectable()
export class AuthGuard implements CanActivate {
    private logger = new Logger("AuthGuard")

    constructor(
        private readonly reflector: Reflector,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
                context.getHandler(),
                context.getClass(),
            ]);

            if (isPublic) {
                return true;
            }

            const request = context.switchToHttp().getRequest();
            const token = this.extractToken(request);

            const payload = await this.jwtService.verifyAsync(
                token,
                {
                    secret: this.configService.get<string>("JWT_SECRET")
                }
            );

            request["user"] = payload;

        } catch (error: any) {
            this.logger.error(error?.message)
            throw new UnauthorizedException(error?.message);
        }

        return true;
    }

    private extractToken(req: Request): string | undefined {

        const authHeader = req.headers.authorization

        const [type, token] = authHeader?.split(' ') ?? [];

        if (type !== "Bearer" || token.length === 0) {
            this.logger.error("No Bearer Token.")
            throw new Error();
        }

        return token;
    }

}