import { Request, Response } from "express";
import { Singleton } from "src/container/Singleton";
import axios from 'axios';
import { DiscordHandler } from "../api/discord/DiscordHandler";
import { TokenResponse } from "src/server/types/discord/TokenResponse";
import { ExpressHandler } from "src/server/handler/ExpressHandler";

const OAUTH_REDIRECT_URI = "http://localhost:25551/api/auth/callback"

@Singleton
export class OAuthRouter {
    constructor(
        private discordHandler: DiscordHandler,
        private expressHandler: ExpressHandler
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

                console.log(response)

                const user = await this.discordHandler.getUser(response.access_token)
                console.log(user)
            } catch (err) {
                return res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
            }
            res.redirect("/")
        })
    }
}