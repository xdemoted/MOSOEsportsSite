import { Request } from "express";
import { Singleton } from "src/container/Singleton";
import jwt from "jsonwebtoken";
import { Logger } from "../logger/Logger";

@Singleton
export class AppAuthHandler {
    public createRefreshToken(userID: string) {
        return jwt.sign(
            {
                id: userID
            },
            process.env.JWT_SECRET as string,
            { expiresIn: "90d" }
        )
    }

    public createAccessToken(userID: string) {
        return jwt.sign(
            {
                id: userID
            },
            process.env.JWT_ACCESS_SECRET as string,
            { expiresIn: "1h" }
        )
    }

    public verifyToken(token: string, secret: string) {
        try {
            return jwt.verify(
                token,
                secret
            )
        } catch (error) {
            throw new Error("invalid token")
        }
    }

    public checkAuth(req: Request): false | string {
        const cookies: Record<string, string> = {}

        req.headers.cookie?.split(';').forEach(cookie => {
            const [name, value] = cookie.trim().split('=')
            cookies[name] = value
        })

        if (!cookies.accessToken) {
            return false;
        }

        try {
            const accessToken = this.verifyToken(cookies.accessToken, process.env.JWT_ACCESS_SECRET as string)
            if (typeof accessToken !== "object" || !accessToken.id) {
                return false;
            }

            return accessToken.id;
        } catch (error) {
            console.log(error)
            return false;
        }
    }
}