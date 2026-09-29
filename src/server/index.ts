import { Singleton } from "src/container/Singleton";
import { ExpressHandler } from "./handler/ExpressHandler";
import { ApiHandler } from "./api/ApiHandler";

@Singleton
export class Server {
    constructor(
        private expressHandler: ExpressHandler,
        private apiHandler: ApiHandler
    ) {
        this.expressHandler = expressHandler;

        const app = this.expressHandler.getApp()

        app.use("/", (req, res) => {
            const url = req.url

            let splitURL = url.slice(1,url.length).split("/")

            splitURL[splitURL.length-1] = splitURL[splitURL.length-1].split("?")[0]

            console.log(splitURL)

            switch (splitURL[0]) {
                case "": {
                    res.sendFile("public/views/index.html", {"root": '.'})
                } break;
                case "api": {
                    console.log("API Request")
                    apiHandler.handleRequest(splitURL,req,res)
                } break;
                case "schedule": {
                    res.sendFile("public/views/index.html", {"root": '.'})
                } break;
                case "games": {
                    res.sendFile("public/views/index.html", {"root": '.'})
                }
            }
        })
    }
}