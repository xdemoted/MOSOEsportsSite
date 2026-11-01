import { Singleton } from "src/container/Singleton";
import { ExpressHandler } from "./handler/ExpressHandler";
import { Logger } from "./logger/Logger";

@Singleton
export class Server {
    constructor(
        private expressHandler: ExpressHandler,
        private logger: Logger // Wait for init
    ) {
        Logger.log("Server initialized")

        this.expressHandler = expressHandler;
        this.logger = logger;

        const app = this.expressHandler.getApp()

        app.use("/", (req, res, next) => {
            if (req.path.length > 1) {
                return next()
            }

            res.sendFile("public/views/index.html", { "root": '.' })
        })
    }
}