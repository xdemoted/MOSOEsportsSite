import { Request, Response } from "express";
import { Singleton } from "src/container/Singleton";
import { OAuthHandler } from "./auth/OAuthHandler";

@Singleton
export class ApiHandler {
    constructor (private authHandler: OAuthHandler) {}

    public handleRequest(pathList:string[], req: Request<{}, any, any, any, Record<string, any>>, res: Response<any, Record<string, any>>) {
        switch (pathList[1]) {
            case "auth": {
                this.authHandler.handleRequest(pathList, req, res)
            } break;
        }
    }
}