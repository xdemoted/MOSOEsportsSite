import { Singleton } from "src/container/Singleton";
import { TokenResponse } from "src/server/types/discord/TokenResponse";
import axios from "axios"
import { UserResponse } from "src/server/types/discord/UserResponse";
import { StorageHandler } from "src/server/storage/StorageHandler";
import { Client, Events, GatewayIntentBits, Guild, GuildMember, PartialGuildMember, Role } from 'discord.js';
import { CompleteableFuture } from "src/utility/CompletableFuture";
import { User } from "../storage/types/User";
import { UserStorageHandler } from "../storage/handlers/UserStorageHandler";

@Singleton
export class DiscordHandler {
    private OAUTH_REDIRECT_URI = process.env.BASE_URL + "/api/auth/callback";

    private guildMemberAdd: ((member: GuildMember) => void)[] = []
    private guildMemberRemove: ((member: GuildMember | PartialGuildMember) => void)[] = []
    private guildMemberUpdate: ((oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) => void)[] = []
    private guildRoleUpdate: ((oldRole: Role, newRole: Role) => void)[] = []

    private guild: CompleteableFuture<Guild> = new CompleteableFuture<Guild>();

    constructor(private userStorage: UserStorageHandler) {
        const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

        client.once(Events.ClientReady, c => {
            console.log(`Discord bot logged in as ${c.user.tag}`);

            client.guilds.fetch(process.env.SERVER_ID as string).then(async guild => {
                this.guild.complete(guild)

                const users = await guild.members.fetch()

                users.forEach(async user => {
                    const existingUser = await userStorage.getUser(user.id)
                    if (existingUser) {
                        let expiry = existingUser.getExpireTime()

                        if (expiry) {
                            expiry -= new Date().getTime()
                        }

                        const mergedUser = new User(
                            existingUser.getDiscordID(),
                            user.user.username,
                            user.displayName,
                            existingUser.getAccessToken(),
                            existingUser.getRefreshToken(),
                            expiry
                        )

                        userStorage.updateUser(mergedUser)
                    } else if (user.roles.cache.has("1408207270981926974")) {
                        const mergedUser = new User(
                            user.id,
                            user.user.username,
                            user.user.displayName
                        )

                        userStorage.updateUser(mergedUser)
                    }
                })
            }).catch(err => {
                throw new Error(`Failed to fetch guild: ${err instanceof Error ? err.message : String(err)}`);
            });
        });

        client.on(Events.GuildMemberAdd, member => {
            this.guildMemberAdd.forEach(listener => listener(member));
        });

        client.on(Events.GuildMemberRemove, member => {
            this.guildMemberRemove.forEach(listener => listener(member));
        });

        client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
            this.guildMemberUpdate.forEach(listener => listener(oldMember, newMember));
        });

        client.on(Events.GuildRoleUpdate, (oldRole, newRole) => {
            this.guildRoleUpdate.forEach(listener => listener(oldRole, newRole));
        });

        client.login(process.env.BOT_TOKEN);
    }

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
        const user = await this.userStorage.getUser(userID)
        const url = `https://discordapp.com/api/v8/guilds/${process.env.SERVER_ID}/members/${userID}`

        if (user && user.isLinked()) {
            if (new Date().getTime() > (user.getExpireTime() as number)) {
                user.updateToken(await this.getToken(user.getRefreshToken() as string))
            }

            const response = (await axios.post(url,
                new URLSearchParams({
                    token: user.getAccessToken() as string
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

    public async getGuildMember(userId: string) {
        const guild = await this.guild.getValue();
        return guild.members.fetch(userId);
    }

    public onGuildMemberAdd(listener: (member: GuildMember) => void) {
        this.guildMemberAdd.push(listener);
    }

    public onGuildMemberRemove(listener: (member: GuildMember | PartialGuildMember) => void) {
        this.guildMemberRemove.push(listener);
    }

    public onGuildMemberUpdate(listener: (oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) => void) {
        this.guildMemberUpdate.push(listener);
    }

    public onGuildRoleUpdate(listener: (oldRole: Role, newRole: Role) => void) {
        this.guildRoleUpdate.push(listener);
    }
}
