import { TokenResponse } from "../discord/TokenResponse";
import { UserResponse } from "../discord/UserResponse";

export class UserCredentials {
    private expires_at: number;

    constructor (
        private id: string,
        private username: string,
        private displayname: string,
        private access_token: string,
        private refresh_token: string,
        expires_in: number
    ) {
        this.expires_at = Date.now() + expires_in
    }

    public getID() {
        return this.id;
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

    public updateToken(response: TokenResponse) {
        this.access_token = response.access_token
        this.refresh_token = response.refresh_token
        this.expires_at = Date.now() + response.expires_in
    } 

    public static fromDiscordResponse(response: UserResponse, accessToken: string, refreshToken: string, expires_in: number): UserCredentials {
        return new UserCredentials(
            response.id,
            response.username,
            response.global_name,
            accessToken, // access_token
            refreshToken, // refresh_token
            expires_in // expires_in
        )
    }

    public static fromJSON(parsedJSON: UserCredentials): UserCredentials {
        return Object.setPrototypeOf(parsedJSON, UserCredentials.prototype)
    }
}