import { Request, Response } from "express";
import { Singleton } from "src/container/Singleton";
import jwt, { JwtPayload } from "jsonwebtoken";
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

    public issueAccessToken(token: string, res: Response) {
        try {
            const refreshToken: JwtPayload = this.verifyToken(token, process.env.JWT_SECRET as string) as JwtPayload

            const accessToken = this.createAccessToken(refreshToken.id)
            Logger.log(`Access token issued: user ${refreshToken.id}`)

            res.cookie("accessToken", accessToken, {
                maxAge: 10 * 60 * 1000,
                httpOnly: true,
                domain: "localhost",
                path: "/",
                sameSite: "strict",
                secure: process.env.BASE_URL?.includes("https"),
            })

            return refreshToken.id
        } catch (error) {

        }
    }

    public checkAuth(req: Request, res: Response): false | string {
        const cookies: Record<string, string> = {}

        req.headers.cookie?.split(';').forEach(cookie => {
            const [name, value] = cookie.trim().split('=')
            cookies[name] = value
        })

        if (!cookies.accessToken) {
            if (!cookies.refreshToken) return false;
            return this.issueAccessToken(cookies.refreshToken, res)
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