import { Request, Response } from "express";
import { Singleton } from "src/container/Singleton";
import axios from 'axios';
import { DiscordHandler } from "../api/discord/DiscordHandler";
import { TokenResponse } from "src/server/types/discord/TokenResponse";
import { ExpressHandler } from "src/server/handler/ExpressHandler";
import { StorageHandler } from "../handler/StorageHandler";
import { UserCredentials } from "../types/storage/UserCredentials";
import { AppAuthHandler } from "../handler/AppAuthHandler";
import { Logger } from "../logger/Logger";

const OAUTH_REDIRECT_URI = process.env.BASE_URL + "/api/auth/callback"

@Singleton
export class OAuthRouter {
    constructor(
        private discordHandler: DiscordHandler,
        private expressHandler: ExpressHandler,
        private storageHandler: StorageHandler,
        private appAuthHandler: AppAuthHandler
    ) {
        const app = this.expressHandler.getApp()

        app.get("/api/auth/redirect", (req, res) => {
            console.log("OAuth Redirect")
            const rootURL = "https://discord.com/oauth2/authorize"

            const options = {
                client_id: process.env.CLIENT_ID as string,
                response_type: "code",
                redirect_uri: OAUTH_REDIRECT_URI,
                scope: "email identify"
            };

            const queryString = new URLSearchParams(options).toString()

            const url = `${rootURL}?${queryString}`
            res.send(url)
        })

        app.get("/api/auth/callback", async (req, res) => {
            try {
                const code = req.query.code
                console.log(code)
                if (typeof code !== "string") {//
                    return res.status(400).json({ error: "Missing authorization code" })
                }

                const response = await this.discordHandler.getToken(code)

                const user = await this.discordHandler.getUser(response.access_token)

                this.storageHandler.updateUser(UserCredentials.fromDiscordResponse(user, response.access_token, response.refresh_token, response.expires_in))

                const token = appAuthHandler.createRefreshToken(user.id)

                Logger.log(`Refresh token issued: user ${user.username} (${user.id}) ; ${req.socket.remoteAddress}`)
                res.cookie("refreshToken", token, {
                    maxAge: 90 * 24 * 60 * 60 * 1000,
                    httpOnly: true,
                    domain: "localhost",
                    path: "/",
                    sameSite: "strict",
                    secure: process.env.BASE_URL?.includes("https"),
                })
            } catch (err) {
                return res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
            }
            res.redirect("/")
        })

        app.get("/api/auth/getAccessToken", async (req, res) => {
            const cookies: Record<string, string> = {}

            req.headers.cookie?.split(';').forEach(cookie => {
                const [name, value] = cookie.trim().split('=')
                cookies[name] = value
            })

            if (!cookies.refreshToken) {
                res.status(401).send({ message: 'No refresh token found' })
                return
            }

            try {
                const refreshToken = appAuthHandler.verifyToken(cookies.refreshToken, process.env.JWT_SECRET as string)

                if (typeof refreshToken !== "object" || !refreshToken.id) {
                    res.status(401).send({ message: 'Invalid refresh token' })
                    return
                }

                const accessToken = appAuthHandler.createAccessToken(refreshToken.id)
                Logger.log(`Access token issued: user ${refreshToken.id} ; ${req.socket.remoteAddress}`)
                res.cookie("accessToken", accessToken, {
                    maxAge: 60 * 60 * 1000,
                    httpOnly: true,
                    domain: "localhost",
                    path: "/",
                    sameSite: "strict",
                    secure: process.env.BASE_URL?.includes("https"),
                })

                res.status(200).send({ message: 'Access token issued' })
            } catch (error) {
                Logger.log(`Failed to verify refresh token: ${error instanceof Error ? error.message : String(error)} ; ${req.socket.remoteAddress}`)
                if (error instanceof Error && error.message === 'invalid token') {
                    res.clearCookie("refreshToken", { domain: "localhost", path: "/" })
                    res.status(401).json({ error: error.message })
                    return
                }
            }
        })
    }
}