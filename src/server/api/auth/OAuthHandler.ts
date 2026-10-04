import { Request, Response } from "express";
import { Singleton } from "src/container/Singleton";
import axios from 'axios';
import { DiscordHandler } from "../discord/DiscordHandler";
import { TokenResponse } from "src/server/types/discord/TokenResponse";

const OAUTH_REDIRECT_URI = "http://localhost:25551/api/auth/callback"

@Singleton
export class OAuthHandler {
    constructor (
        private discordHandler: DiscordHandler
    ) {}

    public async handleRequest(pathList: string[], req: Request<{}, any, any, any, Record<string, any>>, res: Response<any, Record<string, any>>) {
        if (pathList.length < 3) return;

        if (pathList[2] == "redirect") {
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
        } else if (pathList[2] == "callback") {
            try {
                const code = req.query.code
                console.log(code)
                if (typeof code !== "string") {//
                    return res.status(400).json({ error: "Missing authorization code" })
                }

                const response = await this.discordHandler.getToken(code)

                console.log(response)

                console.log(await this.discordHandler.getUser(response.access_token))
            } catch (err) {
                return res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
            }
            res.redirect("/")
        }
    }
}