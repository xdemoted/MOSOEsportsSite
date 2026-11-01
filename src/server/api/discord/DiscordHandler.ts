import { Singleton } from "src/container/Singleton";
import { TokenResponse } from "src/server/types/discord/TokenResponse";
import axios from "axios"
import { UserResponse } from "src/server/types/discord/UserResponse";
import { StorageHandler } from "src/server/handler/StorageHandler";

@Singleton
export class DiscordHandler {
    private OAUTH_REDIRECT_URI = process.env.BASE_URL + "/api/auth/callback";

    constructor (private storageHandler: StorageHandler) {}

    public async getUser(accessToken: string): Promise<UserResponse> {
        const res = await fetch('https://discord.com/api/v10/users/@me', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        return res.json();
    }

    public async getToken(code: string): Promise<TokenResponse> {
        const data = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: this.OAUTH_REDIRECT_URI
        });

        return this.makeDiscordAuthRequest(data)
    }

    public async refreshToken(refreshToken: string): Promise<TokenResponse> {
        const data = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        });

        return this.makeDiscordAuthRequest(data)
    }

    public async revokeToken(accessToken: string) {
        const data = new URLSearchParams({
            token_type_hint: 'access_token',
            token: accessToken
        });

        return this.makeDiscordAuthRequest(data, "https://discord.com/api/oauth2/token/revoke")
    }

    public async addUserToServer(userID: string) {
        const user = await this.storageHandler.getUser(userID).getValue()
        const url = `https://discordapp.com/api/v8/guilds/${process.env.SERVER_ID}/members/${userID}`

        if (user) {
            if (new Date().getTime() > user.getExpireTime()) {
                user.updateToken(await this.getToken(user.getRefreshToken()))
            }

            const response = (await axios.post(url,
                new URLSearchParams({
                    token: user.getAccessToken()
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': `Bot ${process.env.BOT_TOKEN}`
                    }
                }
            ))
        }
    }

    public async makeDiscordAuthRequest(data: URLSearchParams, url?: string) {
        if (!url) url = "https://discord.com/api/oauth2/token"

        const response = (await axios.post(url,
            data.toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                auth: {
                    username: process.env.CLIENT_ID as string,
                    password: process.env.CLIENT_SECRET as string
                }
            }
        )).data

        return response;
    }
}
