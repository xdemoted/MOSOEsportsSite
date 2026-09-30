export interface TokenResponse {
    token_type: string,
    access_token: string,
    expires_in: number,
    refresh_token: string,
    scope: string // Space separated scope list
}