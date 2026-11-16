import { Singleton } from "src/container/Singleton";
import sp from "speakeasy"

@Singleton
export class TOTPHandler {
    public getToken(secret: string) {
        return sp.totp({
            secret: secret,
            encoding: 'base32'
        })
    }
}

console.log(new TOTPHandler().getToken('I65VU7K5ZQL7WB4E'))