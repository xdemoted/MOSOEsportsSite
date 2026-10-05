import { Singleton } from "src/container/Singleton";
import { ExpressHandler } from "./handler/ExpressHandler";

@Singleton
export class Server {
    constructor(
        private expressHandler: ExpressHandler
    ) {
        this.expressHandler = expressHandler;

        const app = this.expressHandler.getApp()

        app.use("/", (req, res, next) => {
            if (req.path.length > 1) {
                return next()
            }

            res.sendFile("public/views/index.html", { "root": '.' })
        })
    }
}