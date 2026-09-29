import { Singleton } from "src/container/Singleton";
import { ExpressHandler } from "./handler/ExpressHandler";

@Singleton
export class Server {
    private expressHandler;
    constructor(expressHandler: ExpressHandler) {
        this.expressHandler = expressHandler;

        const app = this.expressHandler.getApp()

        app.use("/", (req, res) => {
            const url = req.url

            let splitURL = url.slice(1,url.length).split("/")

            console.log(splitURL)

            switch (splitURL[0]) {
                case "": {
                    res.sendFile("public/views/index.html", {"root": '.'})
                } break;
                case "api": {
                    console.log("API Request")
                } break;
                case "about": {
                    
                } break;
            }
        })
    }
}