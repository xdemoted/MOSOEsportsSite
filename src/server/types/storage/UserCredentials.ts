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

    
}