import { Singleton } from "src/container/Singleton";
import express, { NextFunction, Request, Response } from "express";
import { AppAuthHandler } from "./AppAuthHandler";
import { PermissionsHandler } from "./PermissionsHandler";
import { Permission } from "src/server/types/Permission";

@Singleton
export class ExpressHandler {
    private app = express();

    constructor(
        private appAuthHandler: AppAuthHandler,
        private permissionsHandler: PermissionsHandler,
    ) {
        this.app.listen(process.env.APP_PORT, () => {
            console.log(`Server is running on port ${process.env.APP_PORT}`);
        });

        this.app.use(express.static("public/assets/"))

        this.app.use(
            "/protected",
            this.requireAuth(Permission.DASHBOARD_ACCESS),
            express.static("protected/assets/")
        )
    }

    public requireAuth(permission?: Permission) {
        return async (req: Request, res: Response, next: NextFunction) => {
            const userId = this.appAuthHandler.checkAuth(req)

            if (!userId) {
                res.status(401).json({ error: "Unauthorized" })
                return
            }

            if (permission && !(await this.permissionsHandler.hasPermission(userId, permission))) {
                res.status(403).json({ error: "Forbidden" })
                return
            }

            next()
        }
    }

    public getApp() {
        return this.app;
    }
}