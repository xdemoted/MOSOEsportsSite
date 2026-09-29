import { Request, Response } from "express";
import { Singleton } from "src/container/Singleton";
import axios from 'axios';

@Singleton
export class OAuthHandler {
    public async handleRequest(pathList: string[], req: Request<{}, any, any, any, Record<string, any>>, res: Response<any, Record<string, any>>) {
        console.log("OAuth Handler")
        if (pathList.length < 3) return;

        if (pathList[2] == "redirect") {
            console.log("OAuth Redirect")
            const rootURL = "https://discord.com/oauth2/authorize"
            //?client_id=1554522860456775812&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A25551%2Fapi%2Foauth&scope=email+identify

            const options = {
                client_id: process.env.CLIENT_ID as string,
                response_type: "code",
                redirect_uri: "http://localhost:25551/api/auth/callback",
                scope: "email identify"
            };

            const queryString = new URLSearchParams(options).toString()

            const url = `${rootURL}?${queryString}`
            res.send(url)
        } else if (pathList[2] == "callback") {
            try {
                const code = req.query.code
                console.log(code)
                if (!code) return;

                const url = "https://discord.com/api/oauth2/token"

                const data = new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: 'http://localhost:25551/api/auth/token'
                });

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

                console.log(response)
            } catch (err) {
                res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
            }
            res.redirect("/")
        }
    }
}