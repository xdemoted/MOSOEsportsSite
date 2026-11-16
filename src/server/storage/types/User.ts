import { ObjectId } from "mongodb";
import { TokenResponse } from "../../types/discord/TokenResponse";
import { UserResponse } from "../../types/discord/UserResponse";
import { DataRecord } from "./DataRecord";

export class User implements DataRecord {
    private expires_at: number | undefined;
    private linked = false;

    constructor(
        public recordID: string,
        public username: string,
        public displayname: string,
        private access_token?: string,
        private refresh_token?: string,
        expires_in?: number
    ) {
        if (expires_in) {
            this.linked = true
            this.expires_at = Date.now() + expires_in
        }
    }

    public getDiscordID() {
        return this.recordID;
    }

    public getUsername() {
        return this.username
    }

    public setUsername(username: string) {
        this.username = username
    }

    public getDisplayName() {
        return this.displayname
    }

    public setDisplayName(displayname: string) {
        this.displayname = displayname
    }

    public getAccessToken() {
        return this.access_token
    }

    public getRefreshToken() {
        return this.refresh_token
    }

    public getExpireTime() {
        return this.expires_at
    }

    public isLinked() {
        return this.linked;
    }

    public updateToken(response: TokenResponse) {
        this.access_token = response.access_token
        this.refresh_token = response.refresh_token
        this.expires_at = Date.now() + response.expires_in
    }

    public static fromDiscordResponse(response: UserResponse, accessToken: string, refreshToken: string, expires_in: number): User {
        return new User(
            response.id,
            response.username,
            response.global_name,
            accessToken, // access_token
            refreshToken, // refresh_token
            expires_in // expires_in
        )
    }

    public static fromRecord(record: User | null): User | null{
        if (!record) return null;
        return Object.setPrototypeOf(record, User.prototype)
    }
}