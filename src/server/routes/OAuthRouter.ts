import { Request, Response } from "express";
import { Singleton } from "src/container/Singleton";
import axios from 'axios';
import { DiscordHandler } from "../api/discord/DiscordHandler";
import { TokenResponse } from "src/server/types/discord/TokenResponse";
import { ExpressHandler } from "src/server/handler/ExpressHandler";
import { StorageHandler } from "../handler/StorageHandler";
import { UserCredentials } from "../types/storage/UserCredentials";

const OAUTH_REDIRECT_URI = process.env.BASE_URL + "/api/auth/callback"

@Singleton
export class OAuthRouter {
    constructor(
        private discordHandler: DiscordHandler,
        private expressHandler: ExpressHandler,
        private storageHandler: StorageHandler
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
                
                this.storageHandler.updateUser(UserCredentials.fromDiscordResponse(user, response.access_token, response.refresh_token, response.expires_in))
            } catch (err) {
                return res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
            }
            res.redirect("/")
        })
    }
}