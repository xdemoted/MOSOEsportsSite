export interface UserResponse {
    id: string,
    username: string,
    avatar: string,
    discriminator: string,
    global_name: string,
    public_flags: number,
    flags: number,
    banner: string,
    accent_color: number,
    avatar_decoration_data: null,
    mfa_enabled: boolean,
    email: string
    verified: boolean
}